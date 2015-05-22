function WebRTC() {
    // PRIVATE ATTRIBUTES
    var self = this;
    var connection = false;
    var myStream  = null;

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
            console.log("message: ", message);
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
}
