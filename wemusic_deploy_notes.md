cd Downloads/
mv kge_wemusic.pem ~/Desktop/
cd ../desktop

chmod 400 kge_wemusic.pem
ssh -i "kge_wemusic.pem" ubuntu@ec2-18-188-79-207.us-east-2.compute.amazonaws.com

% run ubuntu
sudo apt-get update
sudo apt-get install python3-pip python3-dev nginx git
sudo apt-get install libpq-dev postgresql postgresql-contrib

% postgres
sudo su - postgres
psql
create database wemusic_db;
create user wemusic_user with password 'webapp123';
ALTER ROLE wemusic_user SET client_encoding TO 'utf8';
ALTER ROLE wemusic_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE wemusic_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE wemusic_db TO wemusic_user;
\q
exit

% set virtualenv
sudo apt-get update
sudo pip3 install virtualenv
git clone https://github.com/CMU-Web-Application-Development/Team14.git
cd Team14
virtualenv venv
source venv/bin/activate

pip3 install django
pip3 install psycopg2-binary
pip3 install channels requests
pip3 install bcrypt django-extensions gunicorn

nano src/settings.py 
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'wemusic_db',
        'USER': 'wemusic_user',
        'PASSWORD': 'webapp123',
        'HOST': 'localhost',
        'PORT': '',
    }
}

python3 manage.py makemigrations weMusic
python3 manage.py migrate

python3 manage.py createsuperuser
wemusic_superuser
rachel.gk23@gmail.com
webapp123

sudo vim src/settings.py

ALLOWED_HOSTS = ['18.188.79.207']
python3 manage.py collectstatic
gunicorn --bind 0.0.0.0:8000 src.wsgi:application

sudo vim /etc/systemd/system/gunicorn.service
[Unit]
Description=gunicorn daemon
After=network.target
[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/Team14/src
ExecStart=/home/ubuntu/Team14/venv/bin/gunicorn --workers 3 --bind unix:/home/ubuntu/Team14/src/src.sock src.wsgi:application
[Install]
WantedBy=multi-user.target


sudo systemctl daemon-reload
sudo systemctl start gunicorn
sudo systemctl enable gunicorn


sudo ln -s /etc/nginx/sites-available/src /etc/nginx/sites-enabled
sudo nginx -t
sudo rm /etc/nginx/sites-enabled/default
sudo service nginx restart

sudo vim /etc/nginx/sites-available/src

upstream wemusic {
server unix:///home/ubuntu/Team14/src/src.sock;
}
server {
listen 80;
listen [::]:80;
server_name wemusic-nb.gq www.wemusic-nb.gq;
return 301 https://$server_name$request_uri;
}
server {
listen 443 ssl http2 default_server;
listen [::]:443 ssl http2 default_server;
server_name wemusic-nb.gq www.wemusic-nb.gq;
location /static/ {
        root /home/ubuntu/Team14/src/weMusic;
}
location / {
include proxy_params;
proxy_pass http://unix:/home/ubuntu/Team14/src/src.sock;
}
location /wss {
proxy_pass http://127.0.0.1:8001;

proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";

proxy_redirect off;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded_Host $server_name;
proxy_read_timeout 36000s;
proxy_send_timeout 36000s;
}

ssl_certificate /etc/letsencrypt/live/wemusic-nb.gq/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/wemusic-nb.gq/privkey.pem;
ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
ssl_prefer_server_ciphers on;
ssl_ciphers EECDH+CHACHA20:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;

sudo vim /etc/supervisor/conf.d/supervisord.conf

[program:wemusic_service]
command=uwsgi --ini /home/ubuntu/Team14/src/wemusic_uwsgi.ini
directory=/home/ubuntu/Team14/src
stdout_logfile=/home/ubuntu/Team14/src/log/uwsgi_out.log
stderr_logfile=/home/ubuntu/Team14/src/log/uwsgi_err.log
autostart=true
autorestart=true
user=root
startsecs=10

[program:wemusic_websocket]
command=/home/ubuntu/Team14/src/environment/bin/daphne -b 0.0.0.0 -p 8001 src.asgi:application
directory=/home/ubuntu/Team14/src
stdout_logfile=/home/ubuntu/Team14/src/log/websocket_out.log
stderr_logfile=/home/ubuntu/Team14/src/log/websocket_err.log
autostart=true
autorestart=true
user=root
startsecs=10