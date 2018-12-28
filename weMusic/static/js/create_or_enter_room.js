$(document).ready(function () {
    $('#createRoom').on('shown.bs.modal', function () {
        $('#room_name').focus();
    });

    $('#enterRoom').on('shown.bs.modal', function () {
        $('#enter_room_key').focus();
    });


    function create_public_room(position) {
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        var user_location = $('<input type="hidden" name="lat" value="' + latitude + '" /><input type="hidden" name="long" value="' + longitude + '" />');
        $('#create_room_form').append(user_location);
        $('#create_room_form').submit();
    }

    function enter_public_room(position) {
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        var room_key = $('#enter_room_key').val();
        $.get("/location_verify/" + room_key, {'lat': latitude, 'long': longitude})
            .done(function (data_1) {
                console.log('done verifying location...');
                console.log(data_1);
                if (data_1 == "Valid") {
                    var username = $('#username').val();
                    $.get("/in_room/" + room_key + "/" + username).done(function (data_2) {
                       if (data_2 === "0") {
                           $.post("/add_room_member/" + room_key + "/" + username).done(function () {
                               window.location.replace("http://localhost:8000/enter_room/" + room_key);
                           })
                       } else {
                           window.location.replace("http://localhost:8000/enter_room/" + room_key);
                       }
                    });
                } else {
                    $('#enter_error_msg').text("You are not in the range of this public room.");
                }
            });
    }

    function error() {
        $('#out').innerHTML = "Unable to retrieve your location";
    }


    $('#find_room').click(function () {
        var room_status = $('input:checked').val();
        var room_key = $('#room_key').val();
        $.get("/find_room_key/" + room_key)
            .done(function (data) {
                if (data == "None") {
                    if (room_status == "public") {
                        if (!navigator.geolocation) {
                            $('#out').innerHTML = "<p>Geolocation is not supported by your browser</p>";
                            return;
                        }
                        navigator.geolocation.getCurrentPosition(create_public_room, error);
                    } else {
                        $('#create_room_form').submit();
                    }
                } else {
                    $('#create_error_msg').text("There exists room with this key.");
                }
            });
    });

    $('#enter_room_btn').click(function () {
        var room_key = $('#enter_room_key').val();
        if (room_key.length != 4) {
            $('#enter_error_msg').text("Length of room key should be 4 digits!");
        } else {
            $.get("/find_room_key/" + room_key)
                .done(function (data) {
                    console.log('matched room status is:');
                    console.log(data);
                    if (data == "Public") {
                        if (!navigator.geolocation) {
                            $('#out').innerHTML = "<p>Geolocation is not supported by your browser</p>";
                            return;
                        }
                        console.log('start locating...');
                        navigator.geolocation.getCurrentPosition(enter_public_room, error);
                        console.log('end locating...');
                    } else {
                        if (data == "Private") {
                            $.get("/private_verify/" + room_key)
                                .done(function (data1) {
                                    if (data1 == "Valid") {
                                        console.log('Valid entry');
                                        window.location.replace("http://localhost:8000/enter_room/" + room_key);
                                    } else {
                                        console.log('Invalid entry');
                                        $('#enter_error_msg').text("Your request is already sent to the room host. Please try again after approval.");
                                    }
                                });
                        } else {
                            $('#enter_error_msg').text("There is no room with given key!");
                        }
                    }
                });
        }
    });


    function redirectPost(url, data) {
        var form = document.createElement('form');
        document.body.appendChild(form);
        form.method = 'post';
        form.action = url;
        for (var name in data) {
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = data[name];
            form.appendChild(input);
        }
        form.submit();
    }

    // CSRF set-up copied from Django docs
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    var csrftoken = getCookie('csrftoken');
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    });
});