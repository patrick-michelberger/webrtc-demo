# webrtc-demo

# Setup

```bash
$ git clone git@github.com:pmichelberger/webrtc-demo.git
$ cd webrtc-demo
$ node http-server.js & node webSocketServer/server.js
```
Currently, the demo only works in Chrome.

# Usage
Visit `http://localhost:8000` in your browser. Open another window and visit http://localhost:8000,too.

### User A:
1. Click on `Connect`
2. Click on `Create room`
3. Allow camera access
4. Copy `Room-ID` and send it to `User B`

You should see your video at the bottom.

### User B:
1. Click on `Connect`
2. Paste received 'Room-ID' from `User A` into the Join-room input field 
3. Click on `Join`
4. Allow camera access

You should see two videos at the bottom.
