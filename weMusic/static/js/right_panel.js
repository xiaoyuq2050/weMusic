function loadRoomList(room_key, is_host) {
    $.get("/get_room_playlist/" + room_key).done(function (data) {
        var room_song_list = $('#playlist');
        room_song_list.empty();
        for(var i = 0; i < data.room_songs.length; i++) {
            var song_obj = data.room_songs[i];
            var song = $(document.createElement('li')).addClass('list-group-item d-flex justify-content-between align-items-center py-2');
            song.text(unescape(song_obj.name));
            song.attr({refer_string: song_obj.refer_string, artist: song_obj.artist, album_img: song_obj.album_img, order: i});
            if (is_host === '0') {
                var like_song = $(document.createElement('div')).addClass('float-right');
                var add = $(document.createElement('span')).addClass('btn btn-primary btn-sm oi oi-heart');
                add.attr('id', 'like_song');
                like_song.append(add);
                song.append(like_song);
            } else {
                var pin_song = $(document.createElement('div')).addClass('float-right');
                var pin = $(document.createElement('span')).addClass('btn btn-primary btn-sm oi oi-arrow-circle-top');
                pin.attr('id', 'pin_song');
                pin_song.append(pin);
                song.append(pin_song);
            }
            room_song_list.append(song);
        }
    });
}

// $( function() {
//   $( "#playlist" ).sortable();
//   $( "#playlist" ).disableSelection();
// });

