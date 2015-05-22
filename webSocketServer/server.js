var port = 63949,
    webSocketServer = require('websocket').server,
    http = require('http'),
    uuid = require('uuid'),
    rooms = {};
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
    clients.push(connection);

    send(connection, {
        "clients" : clients
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
                    break;
                default:
                    break;
            }
        } else {

        }
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