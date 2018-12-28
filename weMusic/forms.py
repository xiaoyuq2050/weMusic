from django import forms
from weMusic.models import *


class RoomForm(forms.Form):
    room_status_raw = forms.CharField(label='room_status_raw', max_length=7)
    room_status = forms.BooleanField(required=False)
    room_name = forms.CharField(label='room_name', max_length=20, min_length=4)
    room_key = forms.CharField(label='room_key', max_length=4, min_length=4)

    def clean_room_key(self):
        key = self.cleaned_data.get("room_key")
        if Room.objects.filter(key__exact=key):
            raise forms.ValidationError("Key is already taken.")

        return key

    def clean_room_status(self):
        status_raw = self.cleaned_data.get("room_status_raw")
        print('raw status:')
        print(status_raw)
        print('name:')
        print(self.cleaned_data.get('room_name'))
        print('key:')
        print(self.cleaned_data.get('room_key'))
        if status_raw == "public":
            return False
        return True
