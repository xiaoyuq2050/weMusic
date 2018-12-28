function pause_or_play(event) {
    token = event.data.token;
    room_key = event.data.room_key;
    console.log("pause-----------");

    if (this.innerText == '||') {
        $.post("/pause_song/" + room_key);
        $.ajax({
            url: "https://api.spotify.com/v1/me/player/pause",
            type: "PUT",
            headers: {'Authorization': 'Bearer ' + token}
        })
    }
    if (this.innerText == '▶') {
        $.post("/unpause_song/" + room_key);
        $.ajax({
            url: "https://api.spotify.com/v1/me/player/play",
            type: "PUT",
            headers: {'Authorization': 'Bearer ' + token}
        })
    }
}

function skip(event) {
    token = event.data.token;
    console.log(event.data);
    room_key = event.data.room_key;
    var refer_string = '';
    $.get("/get_next_song/" + room_key).done(function (data) {
        refer_string = data;
        $.ajax({
            url: "https://api.spotify.com/v1/me/player/play",
            type: "PUT",
            headers: {'Authorization': 'Bearer ' + token},
            data: '{"uris": ["spotify:track:' + refer_string + '"]}',
        });
        $.post("/update_playing_song/" + room_key + '/' + refer_string).done(function () {
            socket.send(JSON.stringify({
                'update_songlist': '1',
            }));
        });
    });
}

function send_comment(text, id, user) {
    console.log(user);
    var left = Math.random() * 350;
    console.log("left"+left);
    var singleComment = '<div id="singleComment-' + id.toString() + '" style="padding-top: 500px; padding-left: ' + left.toString() + 'px; font-size: 25px; color:transparent; -webkit-text-stroke: 1px black">' + text.toString() + '</div>';
    $("#comment-screen").append(singleComment);
    $("#singleComment-" + id.toString()).animate({paddingTop:'-2px'}, 5000, function () {	    // $("#singleComment-" + id.toString()).hover(function () {
        $("#singleComment-" + id.toString()).remove();
    });
    var secs = 5000;
    $("#singleComment-" + id.toString()).hover(function () {
        $(this).stop();
        $(this).css("cursor","pointer");
        var elem = document.getElementById("singleComment-" + id.toString());
        var cssStyle = window.getComputedStyle(elem, null).getPropertyValue("padding-top");
        var length = cssStyle.length;
        var distance = parseInt(cssStyle.substring(0, length-2)) + 2;
        var velocity = 500 / 5;
        secs = distance / velocity * 1000;
    }, function () {
        $(this).animate({paddingTop: '-2px'}, secs, function () {
            $("#singleComment-" + id.toString()).remove();
        })
    });
}