from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.models import AbstractUser
from django.db.models import Max


class User(AbstractUser):
    spotify_key = models.CharField(max_length=500, blank=True)
    weMusic_playlist = models.CharField(max_length=500, blank=True)

    class Meta(AbstractUser.Meta):
        pass


class Room(models.Model):
    key = models.CharField(max_length=4)
    name = models.CharField(max_length=20)
    status = models.BooleanField(default=False)  # True: public, False: private
    host = models.ForeignKey(User, models.SET_NULL, blank=True, null=True, related_name='host_rooms')
    staff = models.ManyToManyField(User, related_name='manage_rooms')
    members = models.ManyToManyField(User, related_name='in_rooms')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True)
    playingTime = models.IntegerField(default=0)
    unverified_members = models.ManyToManyField(User, related_name='unverified_rooms')
    room_playlist = models.CharField(max_length=500, blank=True)
    host_access_token = models.CharField(max_length=500, default='host_access_token')
    playing_song = models.CharField(max_length=500, blank=True)
    paused = models.IntegerField(default=0)
    skip = models.IntegerField(default=0)
    pinned_count = models.IntegerField(default=0)

    def __str__(self):
        return self.name


class Song(models.Model):
    name = models.CharField(max_length=500)
    artist = models.CharField(max_length=500)
    refer_string = models.CharField(max_length=500)
    room_name = models.ForeignKey(Room, on_delete=models.CASCADE)
    num_like = models.IntegerField()
    time = models.DateTimeField(auto_now_add=True)
    album_img = models.CharField(max_length=500)
    pinned_order = models.IntegerField(default=0)
    current_playing = models.IntegerField(default=0)

    def __str__(self):
        return '%s, %s' % (self.artist, self.name)

    @staticmethod
    def get_sorted_song_list(room_key):
        room = Room.objects.get(key=room_key)
        return Song.objects.filter(room_name=room).order_by('-current_playing', '-pinned_order', '-num_like')


class Comment(models.Model):
    text = models.CharField(max_length=200)
    shown = models.BooleanField(default=False)
    playing_song = models.CharField(max_length=500, blank=True)
    room = models.CharField(max_length=500, blank=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)

    @staticmethod
    def get_changes(room_key, time="1970-01-01T00:00+00:00"):
        return Comment.objects.filter(room__exact=room_key,
                                      last_changed_time__gt=time).distinct()

    @staticmethod
    def get_max_time():
        return Comment.objects.all().aggregate(
            Max('last_changed_time'))['last_changed_time__max'] or "1970-01-01T00:00+00:00"
