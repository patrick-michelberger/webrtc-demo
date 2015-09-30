function WebRTC() {
    // PRIVATE ATTRIBUTES
    var self = this;
    var connection = false;
    var peerConnection = false;
    var myStream = false;
    var otherStream = false;
    var clients = null;
    var roomId = false;
    var otherSDP = false;
    var othersCandidates = [];

    var peerConfig = {
        iceServers: [{
            "url": "turn:turn01.uswest.xirsys.com:5349?transport=tcp",
            "username": "1_035036b4-6769-11e5-9a40-d48eec181798",
            "credential": "0350375e-6769-11e5-8c9d-0d49faea8878"
        }]
    }; 
    
    // PRIVATE METHODS
    // encode to JSON and send data to server
    var sendToServer = function(data) {
        console.log("send to websocket server: ", data);
        try {
            connection.send(JSON.stringify(data));
            return true;
        } catch (e) {
            console.log('There is no connection to the websocket server');
            return false;
        }
    };

    var createRTCIceCandidate = function(candidate) {
        var ice;
        if (typeof(webkitRTCIceCandidate) === 'function') {
            ice = new webkitRTCIceCandidate(candidate);
        } else if (typeof(RTCIceCandidate) === 'function') {
            ice = new RTCIceCandidate(candidate);
        }
        return ice;
    };

    var createRTCSessionDescription = function(sdp) {
        var newSdp;
        if (typeof(RTCSessionDescription) === 'function') {
            newSdp = new RTCSessionDescription(sdp);
        } else if (typeof(webkitRTCSessionDescription) === 'function') {
            newSdp = new webkitRTCSessionDescription(sdp);
        }
        return newSdp;
    };

    var setIceCandidates = function(iceCandidate) {
        console.log("setIceCandidates: ", iceCandidate);
        // push icecandidate to array if no SDP of other guy is available
        if (!otherSDP) {
            othersCandidates.push(iceCandidate);
        }
        // add icecandidates immediately if not Firefox && if remoteDescription is set
        if (otherSDP && iceCandidate && iceCandidate.candidate && iceCandidate.candidate !== null) {
            console.log("iceCandidate: ", iceCandidate);
            peerConnection.addIceCandidate(createRTCIceCandidate(iceCandidate));
        }
    };

    var handshakeDone = function() {
        var sessionDescription = createRTCSessionDescription(otherSDP);
        console.log("RTCSessionDescription from otherSDP ", otherSDP);
        console.log("peerConnection.setRemoteDescription()", sessionDescription);
        peerConnection.setRemoteDescription(sessionDescription);
        for (var i = 0; i < othersCandidates.length; i++) {
            if (othersCandidates[i]) {
                peerConnection.addIceCandidate(createRTCIceCandidate(othersCandidates[i]));
            }
        }
        //TODO Event "p2pConnectionReady"
    };

    var createOffer = function() {
        if (typeof(RTCPeerConnection) === 'function') {
            peerConnection = new RTCPeerConnection(peerConfig);
        } else if (typeof(webkitRTCPeerConnection) === 'function') {
            peerConnection = new webkitRTCPeerConnection(peerConfig);
        }

        peerConnection.addStream(myStream);

        peerConnection.onaddstream = function(e) {
            otherStream = e.stream;
            var ev = new Event("stream_added", {
                "bubbles": true,
                "cancelable": false
            });
            document.dispatchEvent(ev);
        }

        peerConnection.onicecandidate = function(icecandidate) {
            // send candidates to other peer
            console.log('icecandidate send to room ' + roomId);
            console.log("icecandidate: ", icecandidate.candidate);
            var data = {
                type: "iceCandidate",
                roomId: roomId,
                payload: icecandidate.candidate
            };
            sendToServer(data);
        }

        console.log("peerConnection.createOffer()");
        peerConnection.createOffer(function(SDP) {
            console.log("peerConnection.setLocalDescription(SDP) ", SDP);
            peerConnection.setLocalDescription(SDP);
            var data = {
                type: "offer",
                roomId: roomId,
                payload: SDP
            };
            sendToServer(data);
        });
    };

    var createAnswer = function() {
        if (typeof(RTCPeerConnection) === 'function') {
            peerConnection = new RTCPeerConnection(peerConfig);
        } else if (typeof(webkitRTCPeerConnection) === 'function') {
            peerConnection = new webkitRTCPeerConnection(peerConfig);
        }

        peerConnection.addStream(myStream);
        console.log("peerConnection.setRemoteDescription(otherSDP) ", otherSDP);
        peerConnection.setRemoteDescription(createRTCSessionDescription(otherSDP));

        peerConnection.onaddstream = function(e) {
            otherStream = e.stream;
            var ev = new Event("stream_added", {
                "bubbles": true,
                "cancelable": false
            });
            document.dispatchEvent(ev);
        };
        
        peerConnection.onicecandidate = function(icecandidate) {
            console.log('icecandidate send to room ' + roomId);
            var data = {
                type: 'iceCandidate',
                roomId: roomId,
                payload: icecandidate.candidate
            };
            sendToServer(data);
        };

        console.log("peerConnection.createAnswer()");
        peerConnection.createAnswer(function(SDP) {
            console.log("peerConnection.setLocalDescription(SDP) ", SDP);
            peerConnection.setLocalDescription(SDP);
            for (var i = 0; i < othersCandidates.length; i++) {
                if (othersCandidates[i]) {
                    peerConnection.addIceCandidate(createRTCIceCandidate(othersCandidates[i]));
                }
            }
            // send SDP to other guy
            var data = {
                type: 'answer',
                roomId: roomId,
                payload: SDP
            };
            sendToServer(data);
        });
    };

    // PUBLIC METHODS
    this.connectToSocket = function(wsUrl) {
        // open the WebSocket
        connection = new WebSocket(wsUrl);

        // connection was successful
        connection.onopen = function(event) {
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
                case 'offer':
                    otherSDP = data.payload;
                    createAnswer();
                    break;
                case 'answer':
                    otherSDP = data.payload;
                    handshakeDone();
                    break;
                case 'iceCandidate':
                    setIceCandidates(data.payload);
                    break;
            }
        }
    };

    this.getRoomId = function() {
        return roomId;
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

    this.joinRoom = function(id) {
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
            getUserMedia = navigator.getUserMedia.bind(navigator);
        } else if (navigator.webkitGetUserMedia) {
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

    this.getOtherStream = function() {
        return otherStream;
    };

    this.getClients = function() {
        return clients;
    };

}
