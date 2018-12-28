from django.urls import path
from django.conf.urls import url

from . import consumers

websocket_urlpatterns = [
    path('ws/room_key/<str:room_key>/', consumers.RoomConsumer),
]