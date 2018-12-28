var room_key = $('#room_key').val();
var room_status = $('#room_status').val();
var access_token = $('#access_token').val();
var current_song = $('#playing_song').val();
var room_playlist = $('#room_playlist').val();
var played_time = parseInt($('#played_time').val());
var paused = 1;

window.onSpotifyWebPlaybackSDKReady = () => {
    var current_refer_string = '';
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
        console.log(state);
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
            }, 1000);
        }
        else {
            var play_song = setInterval(function () {
                $.get("/get_room_playlist/" + room_key).done(function (data) {
                    if (data.room_songs.length != 0) {
                        clearInterval(play_song);
                        playsong(current_song, device_id);
                    }
                })
            }, 1000);
        }
    });

    // Not Ready
    player.addListener('not_ready', ({device_id}) => {
        console.log('Device ID has gone offline', device_id);
    });

    // Connect to the player!
    player.connect();

    function playsong(refer_string, device_id) {
        paused = 0;
        skip = 0;
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
                    })
                    $.ajax({
                        url: "https://api.spotify.com/v1/me/player/volume?volume_percent=" + 50,
                        type: "PUT",
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
                        }
                    });
                }, 500);

                var progress = playInterval(device_id);

                skipping = setInterval(function (){
                    $.get("/get_room_playing_song/" + room_key).done(function (data) {
                        if( data != playing_song.value){
                            clearInterval(progress);
                            playing_song.value = data;
                            play_new_song(data, device_id);
                        }
                    });
                }, 1000);
            }
        });
    }

    function play_new_song(refer_string, device_id){
        paused = 0;
        skip = 0;
        $.ajax({
            url: "https://api.spotify.com/v1/me/player/play?device_id=" + device_id,
            type: "PUT",
            data: '{"uris": ["spotify:track:' + refer_string + '"]}',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
            },
            success: function (data) {
                updateInitialSate(player, played_time);

                $.ajax({
                    url: "https://api.spotify.com/v1/me/player/volume?volume_percent=" + 50,
                    type: "PUT",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
                    }
                });

                var progess = playInterval(device_id);

                skipping = setInterval(function (){
                    $.get("/get_room_playing_song/" + room_key).done(function (data) {
                        if( data != playing_song.value){
                            clearInterval(progress);
                            playing_song.value = data;
                            play_new_song(data, device_id);
                        }
                    });
                }, 1000);
            }
        });
    }

    function playInterval(device_id){
        setInterval(function () {
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
                        updateProgressTime(data.progress_ms);
                        updateDuration(current_track.duration_ms);
                        setProgressFlow(data.progress_ms, current_track.duration_ms);
                        updateCurrentState(player);
                        var playing_song = data.item.id;
                    }
                })
            });
            $.get("/play_pause_status/" + room_key).done(function (data) {
                if (paused == 0 && data == 1) {
                    $.ajax({
                        url: "https://api.spotify.com/v1/me/player/pause",
                        type: "PUT",
                        headers: {'Authorization': 'Bearer ' + access_token}
                    });
                    paused = 1;
                }

                if (paused == 1 && data == 0) {
                    $.ajax({
                        url: "https://api.spotify.com/v1/me/player/play",
                        type: "PUT",
                        headers: {'Authorization': 'Bearer ' + access_token}
                    });
                    $.get("/get_played_time/" + room_key).done(function (data) {
                        $.ajax({
                            url: "https://api.spotify.com/v1/me/player/seek?position_ms=" + data + "&device_id=" + device_id,
                            type: "PUT",
                            beforeSend: function (xhr) {
                                xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
                            },
                        })
                    });
                    paused = 0;
                }

            });
        }, 1000);
    }
};