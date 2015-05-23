// Buttons 
var btn_create_room = document.getElementById("createRoom");
var btn_connect = document.getElementById("connect");

// Labels 
var label_connection_status = document.getElementById("connectionStatus");
var label_room_id = document.getElementById("pm-room-id");

// Videos
var my_video = document.getElementById("pm-my-video");
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
    btn_create_room.style.display = 'none';
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
    // connect to websocket server
    WebRTC.connectToSocket('ws://localhost:63949');
});

// create new WebRTC-Object
var WebRTC = new WebRTC();
