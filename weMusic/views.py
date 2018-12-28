from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse
import random
from urllib.parse import urlencode
from collections import OrderedDict
import requests
import json
import time
from weMusic.models import *
from weMusic.forms import *

from django.contrib.auth import login
from django.contrib.auth.decorators import login_required


def welcome_page(request):
    if "code" in request.GET:
        return render(request, 'weMusic/welcome_page.html', {'access_code': request.GET['code']})
    return render(request, 'weMusic/welcome_page.html', {'access_code': " "})


def spotify_auth(request):
    client_id = '12b6dabd655a45c1875c3f5de42d6655'
    scope = 'user-read-private playlist-read-private user-read-playback-state user-modify-playback-state user-read-birthdate user-read-email streaming playlist-modify-private playlist-modify-public'

    redirect_uri = 'http://localhost:8000'

    initial_url = 'https://accounts.spotify.com/authorize?'
    query_string = urlencode(
        OrderedDict(response_type='code', client_id=client_id, scope=scope, redirect_uri=redirect_uri, state='123'))

    return redirect(initial_url + query_string)


def spotify_access_token(request, access_code):
    client_id = '12b6dabd655a45c1875c3f5de42d6655'
    client_secret = 'cffd29505f0d4ea9beab6a395a18da49'

    code = access_code
    redirect_uri = 'http://localhost:8000'

    data = {'grant_type': 'authorization_code', 'code': code, 'redirect_uri': redirect_uri, 'client_id': client_id,
            'client_secret': client_secret}

    # making a Curl request to get the access token
    r = requests.post('https://accounts.spotify.com/api/token', data=data)
    auth_info = json.loads(r.text)

    headers = {'Authorization': 'Bearer ' + auth_info['access_token']}

    r4 = requests.get('https://api.spotify.com/v1/me', headers=headers)
    user_info = json.loads(r4.text)
    # print(user_info)
    username = user_info['id']

    # create new user
    if User.objects.filter(username__exact=username):
        user = User.objects.get(username=username)
    else:
        user = User(username=username)

    user.spotify_key = auth_info['access_token']
    user.first_name = user_info['display_name']
    user.save()
    login(request, user)

    return render(request, 'weMusic/create_or_enter_room.html', {'username': username})


@login_required
def create_room(request):
    user = request.user
    if request.method == 'GET':
        return render(request, 'weMusic/music_playing.html')

    if request.method == 'POST':
        room_key = request.POST["room_key"]
        if request.POST["room_state_raw"] == "public":
            is_public = True
        else:
            is_public = False
        if is_public:
            room = Room(key=room_key, name=request.POST["room_name"],
                        status=is_public, host=user, latitude=request.POST["lat"],
                        longitude=request.POST["long"], host_access_token=user.spotify_key)
        else:
            room = Room(key=request.POST["room_key"], name=request.POST["room_name"],
                        status=is_public, host=user, host_access_token=user.spotify_key)
        room.save()

        # creating a Spotify playlist 
        user_id = user.username
        access_token = user.spotify_key
        headers = {'Authorization': 'Bearer ' + access_token}

        if user.weMusic_playlist:
            r3 = requests.delete('https://api.spotify.com/v1/playlists/' + user.weMusic_playlist + '/followers',
                                 headers=headers)

        data = '{\"name\":\"WeMusic Playlist\", \"public\":\"false\",\"collaborative\":\"true\"}'
        headers_playlist = {'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json'}
        r2 = requests.post('https://api.spotify.com/v1/users/' + user_id + '/playlists', headers=headers_playlist,
                           data=data)
        playlist = json.loads(r2.text)
        user.weMusic_playlist = playlist['id']
        user.save()

        room.room_playlist = user.weMusic_playlist
        room.save()

        return redirect("http://localhost:8000/enter_room/" + room_key)


@login_required
def enter_room(request, room_key):
    room = get_object_or_404(Room, key=room_key)
    context = {}
    user = request.user
    if user == room.host or user in room.members.all():
        access_token = user.spotify_key
        headers = {'Authorization': 'Bearer ' + access_token}
        r1 = requests.get('https://api.spotify.com/v1/me/playlists?offset=0&limit=50', headers=headers)
        playlists = json.loads(r1.text)
        playlists_info = []

        for i in range(0, len(playlists['items'])):
            playlists_info.append([playlists['items'][i]['name'], playlists['items'][i]['id']])

        context['playlists_info'] = playlists_info
        context['access_token'] = access_token
        context['room_key'] = room.key
        context['playlist_id'] = room.room_playlist
        played_time = room.playingTime
        context['played_time'] = played_time
        context['host_access_token'] = room.host_access_token
        context['room_playlist'] = room.room_playlist
        context['playing_song'] = room.playing_song
        if room.status:
            context['room_status'] = 1
        else:
            context['room_status'] = 0

        if user == room.host:
            context['owner'] = 1
        else:
            context['owner'] = 0

        return render(request, 'weMusic/music_playing.html', context)
    return render(request, 'weMusic/welcome_page.html', {'access_code': " "})


def add_song(request, room_key, name, artist, refer_string, album_img):
    room = get_object_or_404(Room, key=room_key)
    song_list = Song.objects.filter(room_name=room.id)
    if song_list.filter(refer_string__exact=refer_string):
        pass
    else:
        new_song = Song(name=name, artist=artist, refer_string=refer_string, room_name=room, album_img=album_img,
                        num_like=0, time=1)
        new_song.save()

    context = {}
    user = request.user
    access_token = user.spotify_key
    headers = {'Authorization': 'Bearer ' + access_token}
    r1 = requests.get('https://api.spotify.com/v1/me/playlists?offset=0&limit=25', headers=headers)
    playlists = json.loads(r1.text)

    if request.user == room.host:
        context['owner'] = 1
    else:
        context['owner'] = 0

    playlists_info = []

    for i in range(0, len(playlists['items'])):
        playlists_info.append([playlists['items'][i]['name'], playlists['items'][i]['id']])

    context['playlists_info'] = playlists_info
    context['access_token'] = access_token
    if room.status:
        context['room_status'] = 1
    else:
        context['room_status'] = 0

    return HttpResponse("")


def update_playing_time(request, room_key, playing_time):
    room = Room.objects.get(key__exact=room_key)
    room.playingTime = int(playing_time)
    room.save()
    return HttpResponse("")


def update_playing_song(request, room_key, playing_song):
    room = get_object_or_404(Room, key=room_key)
    if room.playing_song == "": # if start to play the first song
        room.playing_song = playing_song
        room.save()
        cur_song = Song.objects.get(room_name=room.id, refer_string=playing_song)
        cur_song.current_playing = 1
        cur_song.save()
    if room.playing_song != "" and playing_song != room.playing_song:  # if play the next song
        played_song = Song.objects.get(room_name=room.id, refer_string=room.playing_song)
        add_played_song = Song(name=played_song.name, artist=played_song.artist, refer_string=played_song.refer_string,
                               room_name=played_song.room_name, album_img=played_song.album_img,
                               num_like=0, time=1)
        add_played_song.save()
        played_song.delete()
        room.playing_song = playing_song
        room.save()
        cur_song = Song.objects.get(room_name=room.id, refer_string=playing_song)
        cur_song.current_playing = 1
        cur_song.save()
    return HttpResponse("")


@login_required
def location_verify(request, room_key):
    if request.method == "GET" and request.GET["lat"] and request.GET["long"]:
        room = get_object_or_404(Room, key=room_key)
        if abs(float(room.latitude) - float(request.GET["lat"]) <= 0.0001) and abs(
                float(room.longitude) - float(request.GET["long"]) <= 0.0001):
            return HttpResponse("Valid")
    return HttpResponse("Invalid")


@login_required
def private_verify(request, room_key):
    user = request.user
    room = get_object_or_404(Room, key=room_key)
    if user == room.host or user in room.members.all():
        return HttpResponse("Valid")
    else:
        room.unverified_members.add(request.user)
        return HttpResponse("Invalid")


@login_required
def verify_private_members(request, room_key):
    room = get_object_or_404(Room, key=room_key)
    for username in request.POST.getlist('user'):
        user = get_object_or_404(User, username=username)
        room.unverified_members.remove(user)
        room.members.add(user)
    return redirect("http://localhost:8000/enter_room/" + room_key)


@login_required
def get_unverified_members(request, room_key):
    room = get_object_or_404(Room, key=room_key)
    unverified_members = room.unverified_members.all()
    return render(request, 'weMusic/unverified_members.json', {"users": unverified_members},
                  content_type='application/json')


# @login_required
def get_room_playlist(request, room_key):
    songs = Song.get_sorted_song_list(room_key)
    return render(request, 'weMusic/room_songs.json', {"songs": songs}, content_type='application/json')


@login_required
def get_all_members(request, room_key):
    room = get_object_or_404(Room, key=room_key)
    all_members = room.members.all()
    return render(request, 'weMusic/unverified_members.json', {"users": all_members}, content_type='application/json')


@login_required
def kick_user(request, room_key, username):
    room = get_object_or_404(Room, key=room_key)
    user = get_object_or_404(User, username=username)
    room.members.remove(user)
    print('kicked user in views.py!')
    return redirect("http://localhost:8000/enter_room/" + room_key)


@login_required
def find_room_key(request, room_key):
    room = Room.objects.filter(key=room_key).all()
    if len(room) == 0:
        return HttpResponse("None")
    if room[0].status:  # if public
        return HttpResponse("Public")
    return HttpResponse("Private")


@login_required
def create_comment(request, comment_text, room_key):
    room = get_object_or_404(Room, key=room_key)

    comment = Comment(text=comment_text, playing_song=room.playing_song, room=room.key, sender=request.user)
    comment.save()

    return HttpResponse(str(comment.pk)+","+request.user.first_name)


def pause_song(request, room_key):
    room = Room.objects.get(key__exact=room_key)
    room.paused = 1
    room.save()
    return HttpResponse("")


def unpause_song(request, room_key):
    room = Room.objects.get(key__exact=room_key)
    room.paused = 0
    room.save()
    return HttpResponse("")


def play_pause_status(request, room_key):
    room = Room.objects.get(key__exact=room_key)
    return HttpResponse(room.paused)


def get_played_time(request, room_key):
    room = Room.objects.get(key__exact=room_key)
    return HttpResponse(room.playingTime)


def get_room_playing_song(request, room_key):
    room = Room.objects.get(key__exact=room_key)
    return HttpResponse(room.playing_song)


def pin_song(request, room_key, order):
    room = get_object_or_404(Room, key=room_key)
    room.pinned_count += 1
    room.save()
    song = list(Song.get_sorted_song_list(room_key))[int(order)]
    song.pinned_order = int(room.pinned_count)
    song.save()
    return HttpResponse("")


def like_song(request, room_key, order):
    song = list(Song.get_sorted_song_list(room_key))[int(order)]
    song.num_like += 1
    song.save()
    return HttpResponse("")


def get_next_song(request, room_key):
    song = list(Song.get_sorted_song_list(room_key))[1]
    next_song = song.refer_string
    return HttpResponse(next_song)


def in_room(request, room_key, username):
    room = get_object_or_404(Room, key=room_key)
    user = request.user
    if username == room.host.username or user in room.members.all():
        return HttpResponse("1")
    return HttpResponse("0")


def add_room_member(request, room_key, username):
    room = get_object_or_404(Room, key=room_key)
    room.members.add(request.user)
    return HttpResponse("")



