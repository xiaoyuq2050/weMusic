from django.urls import path, re_path, include

from . import views

urlpatterns = [
    path('', views.welcome_page, name='welcome'),
    path('spotify_auth', views.spotify_auth, name='spotify_auth'),
    path('exchange_access_token/<str:access_code>', views.spotify_access_token, name='exchange_access_token'),
    path('create_room', views.create_room, name='create_room'),
    path('enter_room/verify_private_members/<str:room_key>', views.verify_private_members, name='verify_private_members'),
    path('enter_room/<str:room_key>', views.enter_room, name='enter_room'),
    path('add_song/<str:room_key>/<str:name>/<str:artist>/<str:refer_string>/<str:album_img>', views.add_song,
         name='add_song'),
    path('find_room_key/<str:room_key>', views.find_room_key, name='find_room_key'),
    path('location_verify/<str:room_key>', views.location_verify, name='location_verify'),
    path('private_verify/<str:room_key>', views.private_verify, name='private_verify'),
    path('get_unverified_members/<str:room_key>', views.get_unverified_members, name='get_unverified_members'),
    path('update_playing_time/<str:room_key>/<str:playing_time>', views.update_playing_time, name='update_playing_time'),
    path('get_room_playlist/<str:room_key>', views.get_room_playlist, name="get_room_playlist"),
    path('update_playing_song/<str:room_key>/<str:playing_song>', views.update_playing_song, name='update_playing_song'),
    path('create_comment/<str:comment_text>/<str:room_key>', views.create_comment, name='create_comment'),
    path('get_all_members/<str:room_key>', views.get_all_members, name='get_all_members'),
    path('kick_user/<str:room_key>/<str:username>', views.kick_user, name='kick_user'),
    path('pause_song/<str:room_key>', views.pause_song, name='pause_song'),
    path('unpause_song/<str:room_key>', views.unpause_song, name='unpause_song'),
    path('play_pause_status/<str:room_key>', views.play_pause_status, name='play_pause_status'),
    path('get_played_time/<str:room_key>', views.get_played_time, name='get_played_time'),
    path('get_room_playing_song/<str:room_key>', views.get_room_playing_song, name='get_room_playing_song'),
    path('pin_song/<str:room_key>/<str:order>', views.pin_song, name='pin_song'),
    path('like_song/<str:room_key>/<str:order>', views.like_song, name='like_song'),
    path('get_next_song/<str:room_key>', views.get_next_song, name='get_next_song'),
    path('in_room/<str:room_key>/<str:username>', views.in_room, name='is_host'),
    path('add_room_member/<str:room_key>/<str:username>', views.add_room_member, name='add_room_member'),
]
