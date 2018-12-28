function generateRegisterHTML() {
    var html = '        <h2>Register</h2>\n' +
        '        With a Spotify Username\n' +
        '        <br>\n' +
        '        <div class="input-group w-50">\n' +
        '            <input type="text" class="form-control" placeholder="Username" aria-label="Username"\n' +
        '                   aria-describedby="basic-addon1">\n' +
        '        </div>\n' +
        '        <br>\n' +
        '        <div class="input-group w-50">\n' +
        '            <input type="text" class="form-control" placeholder="Password" aria-label="Username"\n' +
        '                   aria-describedby="basic-addon1">\n' +
        '        </div>\n' +
        '        <br>\n' +
        '        <div class="input-group w-50">\n' +
        '            <input type="text" class="form-control" placeholder="Confirm Password" aria-label="Username"\n' +
        '                   aria-describedby="basic-addon1">\n' +
        '        </div>\n' +
        '        <br>\n' +
        '        <div class="form-check">\n' +
        '            <input type="checkbox" class="form-check-input" id="rememberUnchecked">\n' +
        '            <label class="form-check-label" for="rememberUnchecked">Remember me</label>\n' +
        '        </div>\n' +
        '        <br>\n' +
        '        <div class="row w-50">\n' +
        '            <button class="btn btn-outline-primary" id="loginBtn">Log in</button>\n' +
        '            <button class="btn btn-primary ml-auto" id="registerBtn">Register</button>\n' +
        '        </div>';
    return html;
}

$(document).ready(function () {
    $('#loginBtn').focus();
    $('#loginBtn').keypress = function(e) {
        if (e.which == 13) {  // enter, return
            $('#loginBtn').click();
        }
    };
    $('#registerBtn').click(function () {
        $('#login').empty();
        $('#login').append(generateRegisterHTML);
    });
    var access_code = $('#access-code').val();
    if (access_code.length > 10) {
        $('#spotify-auth').show();
        $('#OK').focus();
        $('#OK').keypress = function(e) {
            if (e.which == 13) {  // enter, return
                console.log('enter');
                $('#OK').click();
            }
        };
    } else {
        $('#spotify-auth').hide();
    }
})