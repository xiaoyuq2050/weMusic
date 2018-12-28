from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
import json


class RoomConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_key']
        self.room_group_name = 'room_%s' % self.room_name

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )
        self.accept()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        if 'message' in text_data_json and text_data_json['message']:
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'comment_message',
                    'message': text_data_json['message'],
                    'message_id': text_data_json['message_id'],
                    'message_user': text_data_json['message_user'],
                }
            )
        elif 'update_songlist' in text_data_json and text_data_json['update_songlist']:
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'update_songlist',
                    'update_songlist': 1,
                }
            )

    # Receive message from room group
    # Different code type of web socket:
    # 0: send new comment
    def comment_message(self, event):
        message = event['message']
        message_id = event['message_id']
        message_user = event['message_user']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'type': '0',
            'message': message,
            'message_id': message_id,
            'message_user': message_user
        }))

    # 1: update songlist in the right panel
    def update_songlist(self, event):
        self.send(text_data=json.dumps({
            'type': '1'
        }))
