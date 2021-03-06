var port = 63949,
    webSocketServer = require('websocket').server,
    http = require('http'),
    uuid = require('uuid'),
    rooms = {},
    clients = [];

var server = http.createServer(function(req, res) {});

server.listen(port, function() {
    console.log((new Date()) + " Server is listening on port " + port);
});

var wsServer = new webSocketServer({
    httpServer: server
});

wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);

    clients.forEach(function(client) {
        send(client, {
            "type": "newClient",
            "payload": connection.remoteAddress
        });
    });

    clients.push(connection);

    send(connection, {
        "type": "initClients",
        "payload": clients.map(function(client) {
            return client.remoteAddress;
        })
    });

    connection.on('message', function(message) {
        console.log('Incoming Message from ' + request.origin);
        try {
            var data = JSON.parse(message.utf8Data);
        } catch (e) {
            console.log('This does not look like valid JSON');
        }

        if (data !== undefined && data.type !== undefined) {
            switch (data.type) {
                case 'createRoom':
                    // generate roomId and store current connection
                    var roomId = uuid.v1();
                    rooms[roomId] = {
                            creatorConnection: connection,
                            partnerConnection: false,
                        }
                        // send token to user
                    var data = {
                        type: 'roomCreated',
                        payload: roomId
                    };
                    return send(rooms[roomId].creatorConnection, data);
                    break;
                case 'offer':
                    console.log("offer received");
                    if (rooms[data.roomId].partnerConnection) {
                        var data = {
                            type: "error",
                            payload: "room is already full"
                        };
                        return send(connection, data);
                    }
                    rooms[data.roomId].partnerConnection = this;
                    return send(rooms[data.roomId].creatorConnection, data);
                    break;
                default:
                    if (this === rooms[data.roomId].partnerConnection) {
                        console.log("send to creator: ", data.type);
                        console.log("data: ", data);
                        return send(rooms[data.roomId].creatorConnection, data);
                    }
                    console.log("send to partner: ", data.type);
                    console.log("data: ", data);
                    return send(rooms[data.roomId].partnerConnection, data);
                    break;
            }
        } else {
            var data = {
                type: 'error',
                payload: 'ERROR FROM SERVER: Incorrect data or no data received'
            };
            send(connection, data);
        }
    });

    connection.on('close', function(evt) {
        // close user connection
        console.log((new Date()) + " Peer disconnected.");
        var index = clients.indexOf(connection);
        if (index >= 0)
            clients.splice(index, 1);
        else
            trace("Delete disconnected peer fail.");
    });
});

// this function sends data to the other user
var send = function(connection, data) {
    try {
        connection.sendUTF(JSON.stringify(data));
    } catch (e) {
        console.log('\n\n!!!### ERROR while sending message ###!!!\n');
        console.log(e + '\n');
        return;
    }
};
