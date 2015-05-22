// Buttons 
var btn_create_room = document.getElementById("createRoom");
var btn_connect = document.getElementById("connect");

// Labels 
var label_connection_status = document.getElementById("connectionStatus");

// Videos
var my_video = document.getElementById("pm-my-video");

// Event listeners
// websocket events 
document.addEventListener('socket_connected', function(socketEvent) {
    label_connection_status.innerHTML = "open";
    label_connection_status.classList.remove("label-danger");
    label_connection_status.classList.add("label-success");
    btn_connect.style.display = "none";

});

document.addEventListener('socket_closed', function(socketEvent) {
    label_connection_status.innerHTML = "closed";
    label_connection_status.classList.remove("label-success");
    label_connection_status.classList.add("label-danger");
    btn_connect.style.display = "block";
});

// UI events
btn_create_room.addEventListener('click', function(e) {
    e.preventDefault();
    var success = function(myStream) {
        my_video.src = URL.createObjectURL(myStream);
        // create a room
        //WebRTC.createRoom();
    };
    WebRTC.getMedia({
        audio: true,
        video: true
    }, success);
});

btn_connect.addEventListener('click', function(e) {
    // connect to websocket server
    WebRTC.connectToSocket('ws://localhost:63949');
});

// create new WebRTC-Object
var WebRTC = new WebRTC();
