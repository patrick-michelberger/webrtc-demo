function WebRTC() {
    // PRIVATE ATTRIBUTES
    var self = this;
    var connection = false;
    var peerConnection = false;
    var myStream = false;
    var otherStream = false;
    var clients = null;
    var roomId = false;

    var peerConfig = {
        "iceServer": [{
            url: "stun:stun.l.google.com:19302"
        }]
    };
    var peerConstraints = {
        "optional": [{
            "DtlsSrtpKeyAgreement": true // set DTLS encrpytion
        }]
    };

    // PRIVATE METHODS
    // encode to JSON and send data to server
    var sendToServer = function(data) {
        try {
            connection.send(JSON.stringify(data));
            return true;
        } catch (e) {
            console.log('There is no connection to the websocket server');
            return false;
        }
    };

    var createOffer = function() {
        if (typeof(RTCPeerConnection) === 'function') {
            peerConnection = new RTCPeerConnection(peerConfig);
        } else if (typeof(webkitRTCPeerConnection) === 'function') {
            peerConnection = new webkitRTCPeerConnection(peerConfig);
        }

        peerConnection.addStream(myStream);

        peerConnection.onaddstream = function(e) {
            console.log("stream added");
            otherStream = e.stream;
        }

        peerConnection.onicecandidate = function(icecandidate) {
            console.log("icecandidate send to room: " + roomId);
            // send candidates to other peer
            var data = {
                type: "iceCandidate",
                roomId: roomId,
                payload: icecandidate
            };
            sendToServer(data);
        }

        peerConnection.createOffer(function(SDP) {
            peerConnection.setLocalDescription(SDP);
            var data = {
                type: "offer",
                roomId: roomId,
                payload: SDP
            };
            console.log("send offer");
            sendToServer(data);
        });
    };

    // PUBLIC METHODS
    this.connectToSocket = function(wsUrl) {
        // open the websocket
        connection = new WebSocket(wsUrl);

        // connection was successful
        connection.onopen = function(event) {
            console.log((new Date()) + ' Connection successfully established');
            var ev = new Event("socket_connected", {
                "bubbles": true,
                "cancelable": false
            });
            document.dispatchEvent(ev);
        };

        // connection couldn't be established
        connection.onerror = function(error) {
            console.log((new Date()) + ' WebSocket connection error: ');
            console.log(error);
        };

        // connection was closed
        connection.onclose = function(event) {
            console.log((new Date()) + ' Connection was closed');
            var ev = new Event("socket_closed", {
                "bubbles": true,
                "cancelable": false
            });
            document.dispatchEvent(ev);
        };

        // this function is called whenever the server sends some data
        connection.onmessage = function(message) {
            try {
                var data = JSON.parse(message.data);
            } catch (e) {
                console.log('This doesn\'t look like a valid JSON or something else went wrong.');
                console.log(message);
                return;
            }
            console.log("message data: ", data);
            switch (data.type) {
                // the server has created a room and returns the room-ID
                case 'initClients':
                    clients = data.payload;
                    var ev = new Event("init_clients", {
                        "bubbles": true,
                        "cancelable": false
                    });
                    document.dispatchEvent(ev);
                    break;
                case 'newClient':
                    client = data.payload;
                    clients.push(client);
                    var ev = new Event("add_client", {
                        "bubbles": true,
                        "cancelable": false
                    });
                    document.dispatchEvent(ev);
                    break;
                case 'roomCreated':
                    roomId = data.payload;
                    var ev = new Event("room_created", {
                        "bubbles": true,
                        "cancelable": false
                    });
                    document.dispatchEvent(ev);
                    break;

            }
        }
    };

    this.createRoom = function() {
        // create data-object
        var data = {
            type: 'createRoom',
            payload: false
        };
        // send data-object to server
        return sendToServer(data);
    };

    this.joinRoom = function() {
        roomId = id;
        createOffer();
    }

    this.getMedia = function(constraints, success, fail) {
        // set default constraints 
        if (!constraints) {
            constraints = {
                audio: true,
                video: true
            }
        }

        if (navigator.getUserMedia) {
            console.log("prefix-less");
            getUserMedia = navigator.getUserMedia.bind(navigator);
        } else if (navigator.webkitGetUserMedia) {
            console.log("webkit");
            getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
        }

        getUserMedia(constraints, function(stream) {
            myStream = stream;
            if (success) {
                success(myStream);
            }
        }, function(error) {
            console.log("getUserMedia failed: ", error);
            if (fail) {
                fail();
            }
        });

    };

    this.getRoomId = function() {
        return roomId;
    };

    this.getClients = function() {
        return clients;
    }
}
