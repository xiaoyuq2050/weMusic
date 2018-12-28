var room_key = $('#room_key').val();
var room_status = $('#room_status').val();
var access_token = $('#access_token').val();
var current_song = $('#playing_song').val();
var room_playlist = $('#room_playlist').val();
var played_time = parseInt($('#played_time').val());

console.log('room status is...');

console.log(room_status);

$('#get-all-unverified').click(function () {
    updateVerify();
});


function updateVerify() {
    console.log('update verify!');
    $.get("/get_unverified_members/" + room_key).done(function (data) {
        $('#get-all-unverified').innerText = 'Requests: ' + data.users.length;
        var unverified_members = $('#unverified_members');
        unverified_members.empty();
        var unverified_members_str = "<form action=\"verify_private_members/" + room_key + "\" method='post'>";
        for (var i = 0; i < data.users.length; i++) {
            user = data.users[i];
            var each_user = '<input type="checkbox" name="user" value=' + user['username'] + ">" + user['first_name'] + '<br>';
            unverified_members_str += each_user;
        }
        unverified_members_str += '<input type="submit" value="Done"></form>';
        unverified_members.append($(unverified_members_str));
    });
}

window.onSpotifyWebPlaybackSDKReady = () => {
    var current_refer_string = "";
    const player = new Spotify.Player({
        name: 'Web Playback SDK Quick Start Player',
        getOAuthToken: cb => {
            cb(access_token);
        }
    });

    // Error handling
    player.addListener('initialization_error', ({message}) => {
        console.error(message);
    });
    player.addListener('authentication_error', ({message}) => {
        console.error(message);
    });
    player.addListener('account_error', ({message}) => {
        console.error(message);
    });
    player.addListener('playback_error', ({message}) => {
        console.error(message);
    });

    // Playback status updates
    player.addListener('player_state_changed', state => {
        var icon = document.getElementById('icon-play');
        if (state['paused']) {
            icon.innerText = '▶';
        }
        else {
            icon.innerText = '||';
        }
    });

    // Ready
    player.addListener('ready', ({device_id}) => {
        console.log('Ready with Device ID', device_id);
        if (current_song == '') {

            var play_song = setInterval(function () {
                    $.get("/get_room_playlist/" + room_key).done(function (data) {
                        if (data.room_songs.length != 0) {
                            clearInterval(play_song);
                            var current_song = data.room_songs[0];
                            play_new_song(current_song.refer_string, device_id);
                        }
                    })
                }
                , 1000);
        }
        else {
            var play_song = setInterval(function () {
                    $.get("/get_room_playlist/" + room_key).done(function (data) {
                        if (data.room_songs.length != 0) {
                            clearInterval(play_song);
                            playsong(current_song, device_id);
                        }
                    })
                }
                , 1000);
        }
    });

    // Not Ready
    player.addListener('not_ready', ({device_id}) => {
        console.log('Device ID has gone offline', device_id);
    });
    // Connect to the player!
    player.connect();

    function playsong(refer_string, device_id) {
        console.log('in playsong');
        console.log(refer_string);
        $.ajax({
            url: "https://api.spotify.com/v1/me/player/play?device_id=" + device_id,
            type: "PUT",
            data: '{"uris": ["spotify:track:' + refer_string + '"]}',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
            },
            success: function (data) {
                updateInitialSate(player, played_time);
                setTimeout(function () {
                    $.ajax({
                        url: "https://api.spotify.com/v1/me/player/seek?position_ms=" + played_time + "&device_id=" + device_id,
                        type: "PUT",
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
                        },
                        success: function (data) {
                        }
                    });
                    $.ajax({
                        url: "https://api.spotify.com/v1/me/player/volume?volume_percent=" + 50,
                        type: "PUT",
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
                        }
                    });
                }, 500);
                playInterval(device_id);
            }
        });
    }

    function play_new_song(refer_string, device_id) {
        $.ajax({
            url: "https://api.spotify.com/v1/me/player/play?device_id=" + device_id,
            type: "PUT",
            data: '{"uris": ["spotify:track:' + refer_string + '"]}',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
            },
            success: function (data) {
                $.ajax({
                    url: "https://api.spotify.com/v1/me/player/volume?volume_percent=" + 50,
                    type: "PUT",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
                    }
                });
                updateInitialSate(player, played_time);
                playInterval(device_id);
            }
        });
    }

    function playInterval(device_id){
        var progressInterval = setInterval(function () {
            player.getCurrentState().then(state => {
                if (!state) {
                    console.error('User is not playing music through the Web Playback SDK');
                    return;
                }
                let {
                    current_track,
                    next_tracks: [next_track]
                } = state.track_window;

                $.ajax({
                    url: "https://api.spotify.com/v1/me/player/currently-playing",
                    type: "GET",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
                    },
                    success: function (data) {
                        var pause = 0;
                        $.get("/play_pause_status/" + room_key).done(function (data2) {
                            pause = data2;
                            if(data.is_playing == false && pause == 0 && data.progress_ms == 0){
                                console.log("clear");
                                clearInterval(progressInterval);
                                $.get("/get_next_song/" + room_key).done(function (data) {
                                    play_new_song(data, device_id);
                                    $.post("/update_playing_song/" + room_key + '/' + data).done(function () {
                                        loadRoomList(room_key, 1);
                                    });
                                });
                            }
                            $.post("/update_playing_time/" + room_key + '/' + data.progress_ms);
                            updateProgressTime(data.progress_ms);
                            updateDuration(current_track.duration_ms);
                            setProgressFlow(data.progress_ms, current_track.duration_ms);
                            updateCurrentState(player);

                        })
                    }
                })
            });
        }, 1000);
    }
};





