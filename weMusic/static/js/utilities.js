function updateProgressTime(mstime) {
    var sec = secondsToTime(mstime);
    $("#current").empty();
    $("#current").append(sec);
}

function setProgressFlow(current, duration) {
    var progression = current / duration;
    var width = progression * 100 + "%";
    $('#progress').css({
        "width": width, "height": "20%", "position": "absolute",
        "bottom": "0", "left": "0", "background": "linear-gradient(to bottom, grey, blue)",
        "border-bottom-left-radius": "10px", "border-bottom-right-radius": "10px", "opacity": ".4"
    });
}

function secondsToTime(mstime) {
    if (mstime == 0) return "00:00";
    var sec = Math.floor(mstime / 1000);
    var minutes = Math.floor(sec / 60);
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    var seconds = sec - minutes * 60;
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return minutes + ":" + seconds;
}

function updateAlbumImg(url) {
    $("#albumPic").empty();
    var imgsrc = '<img src=' + '"' + url + '"' + ' alt="default album pic"' +
        'style="width: 100%; height: 100%">';
    $("#albumPic").append(imgsrc);
}

function updateDuration(mstime){
    var duration = secondsToTime(mstime);
    $('#total').empty();
    $('#total').append(duration);
}

function updateCurrentState(player){
    player.getCurrentState().then(state => {
      if (!state) {
        console.error('User is not playing music through the Web Playback SDK');
        return;
      }

      let {
        current_track,
        next_tracks: [next_track]
      } = state.track_window;

      updateAlbumImg(current_track.album.images[0].url);
      updateDuration(current_track.duration_ms);
      $("#songName").empty();
      $("#songName").append(current_track.name);
      $("#artist").empty();
      $("#artist").append(current_track.artists[0].name);
    });
}

function updateInitialSate(player, played_time){
    player.getCurrentState().then(state => {
      if (!state) {
        console.error('User is not playing music through the Web Playback SDK');
        return;
      }

      let {
        current_track,
        next_tracks: [next_track]
      } = state.track_window;
      updateAlbumImg(current_track.album.images[0].url);
      updateDuration(current_track.duration_ms);
      $("#songName").empty();
      $("#songName").append(current_track.name);
      $("#current").empty();
      $("#current").append(secondsToTime(played_time));
      setProgressFlow(current_track.duration_ms);
    });
}


