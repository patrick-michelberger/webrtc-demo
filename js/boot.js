// Buttons 
var btn_create_room = document.getElementById("createRoom");
var btn_connect = document.getElementById("connect");
var btn_join_room = document.getElementById("pm-join-room");

// Inputs
var input_room_id = document.getElementById("pm-input-room-id");

// Labels 
var label_connection_status = document.getElementById("connectionStatus");
var label_room_id = document.getElementById("pm-room-id");

// Videos
var my_video = document.getElementById("pm-my-video");
var other_video = document.getElementById("pm-other-video");
var container_clients = document.getElementById("pm-clients-container");

// Event listeners
// websocket events 
document.addEventListener('socket_connected', function(socketEvent) {
    label_connection_status.innerHTML = "open";
    label_connection_status.classList.remove("label-danger");
    label_connection_status.classList.add("label-success");
    btn_connect.style.display = "none";
    btn_create_room.style.display = "block";
});

document.addEventListener('socket_closed', function(socketEvent) {
    label_connection_status.innerHTML = "closed";
    label_connection_status.classList.remove("label-success");
    label_connection_status.classList.add("label-danger");
    btn_connect.style.display = "block";
    btn_create_room.style.display = "none";
});

document.addEventListener('init_clients', function(socketEvent) {
    var clients = WebRTC.getClients();
    for (var i = 0; i < clients.length; i++)  {
        var node = document.createElement("LI");
        var textNode = document.createTextNode(clients[i]);
        node.appendChild(textNode);
        container_clients.appendChild(node);
    }
});

document.addEventListener('add_client', function(socketEvent) {
    var clients = WebRTC.getClients();
    var new_client = clients[container_clients.children.length];
    var node = document.createElement("LI");
    var textNode = document.createTextNode(new_client);
    node.appendChild(textNode);
    container_clients.appendChild(node);
});

document.addEventListener('room_created', function(socketEvent) {
    label_room_id.innerHTML = WebRTC.getRoomId();
    var node = document.createElement("LI");
    var textNode = document.createTextNode("TEXT LOG");
    node.appendChild(textNode);
    container_clients.appendChild(node);
});

document.addEventListener('stream_added', function(socketEvent) {
    console.log("other stream ObjectUrl: ", URL.createObjectURL(WebRTC.getOtherStream()));
    other_video.src = URL.createObjectURL(WebRTC.getOtherStream());
});

// UI events
btn_create_room.addEventListener('click', function(e) {
    e.preventDefault();
    var success = function(myStream) {
        my_video.src = URL.createObjectURL(myStream);
        // create a room
        WebRTC.createRoom();
    };
    WebRTC.getMedia({
        audio: true,
        video: true
    }, success);
});

btn_connect.addEventListener('click', function(e) {
    e.preventDefault();
    // connect to websocket server
    WebRTC.connectToSocket('ws://localhost:63949');
});

btn_join_room.addEventListener('click', function(e) {
    e.preventDefault();
    if (!input_room_id.value) {
        console.log("Please set a room ID before joining a room!");
        return;
    }
    var success = function(myStream) {
        my_video.src = URL.createObjectURL(myStream);
        WebRTC.joinRoom(input_room_id.value);
    };
    WebRTC.getMedia({
        audio: true,
        video: true
    }, success);
});

// create new WebRTC-Object
var WebRTC = new WebRTC();
