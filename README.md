web-rockets
===

Start/stop a socket.io server in a few lines. Useful for prototyping.

# Install

```bash
npm install web-rockets
```

# Usage

```js
import WebRockets from 'web-rockets';

new WebRockets();
```

A Web Socket Server needs a HTTP server. We'll start one for you if you don't specify any.

# Express integration

```js
import http from 'http';
import express from 'express';

const httpServer = http.createServer(express());

httpServer.listen(() => new WebRockets(httpServer));
```

# Express emitter

```js
import HTTPServer from 'express-emitter';

const httpServer = new HTTPServer()
  .on('listening', () => new WebRockets(httpServer));
```

# Stop and restart

```js
const webRockets = new WebRockets()
  .stop()
  .then(() => webRockets.start());
```

# Listeners

You can add or remove listeners like this:

```js
const ping = socket => socket.emit('pong');

new WebRockets()
  .listen('ping', ping)
  .unlisten('ping', ping);
```

# Middleware

```js
new WebRockets()
  // the same way you would do with socket.io
  .use((socket, next) => next());
```

# Authentification by cookie

We support authentication via cookie if you also install `web-rockets-cookie`.

```js
import identifyByCookie from 'web-rockets-cookie';

new WebRockets()
  .use(identifyByCookie(
    cookieName, // String - name of the cookie,
    true, // Boolean . true for secure cookies
    (cookie, socket, next) => { /* ... */ } // what to do
  ));
```
