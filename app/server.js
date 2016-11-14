// @flow

import SocketIO from 'socket.io';
import {EventEmitter} from 'events';
import http from 'http';

export default class WebRockets extends EventEmitter {

  // messages we are listening to

  listeners = {};

  // list of sockets (clients) connected to server

  sockets = [];

  // 0 for server down, 1 for server up

  status = 0;

  /** Constructor - Start a new Socket.io server
   *
   *  @arg {HttpServer} server - the HTTP server to attach the Socket server to
   *  @arg number server - the port to create a new HTTP server
   */

  constructor(server: http.Server | number) {
    super();

    // If no HTTP server is given, we'll spring one
    if (!server) {
      this.server = http.createServer();
      this.server.listen();
    } else if (typeof server === 'number') {
      this.server = http.createServer();
      this.server.listen(server);
    } else {
      this.server = server;
    }

    // Starting socket server
    // (we use next tick to make sure EventEmitter can emit)
    process.nextTick(this.start.bind(this));

    // Once server is up, change status to reflect that
    this.on('listening', () => {
      this.status = 1;
    });

    // Ditto for server downº
    this.on('stopped', () => {
      this.status = 0;
    });
  }

  // The actual function that starts the server

  start() {
    this.io = SocketIO.listen(this.server);

    this.emit('listening');

    this.io
      .on('error', this.emit.bind(this, 'error'))
      .on('connection', this.client.bind(this))
      .use((socket, next) => {
        // add new client to  list of clients
        this.sockets.push(socket);
        next();
      });
  }

  // Gracefully stop the socket server

  stop(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        this.emit('stopping');

        // If no clients, stop server now
        if (!this.sockets.length) {
          return resolve();
        }

        // Disconnect each socket asynchronously
        const promises = this.sockets.map(socket =>
          new Promise((resolveDisconnect) => {
            if (!socket.connected) {
              return resolveDisconnect();
            }

            socket
              .on('disconnect', resolveDisconnect)
              .disconnect(true);
          })
        );

        // Once all sockets are disconnected

        await Promise.all(promises);

        this.emit('stopped');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // To be called on each client connection

  client(socket) {
    // Handle disconnects - remove socket from list of sockets
    socket.on('disconnect', () => {
      this.sockets = this.sockets.filter($socket => $socket.id !== socket.id);
    });

    // Attach event listeners to client
    for (let event in this.listeners) {
      this.listeners[event].forEach(cb =>
        socket.on(event, (...messages) => cb(socket, ...messages))
      );
    }
  }

  // Add middleware

  use (middleware) {
    process.nextTick(() => this.io.use(middleware));
    return this;
  }

  // Add an event listener

  listen(event, cb): WebRockets {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(cb);

    // If listen is called when there are already clients connected
    //  then these clients are not listening - so we'll make them listen here

    process.nextTick(() => {
      if (this.status && this.io.sockets) {
        for (let socket in this.io.sockets.sockets) {
          const $socket = this.io.sockets.sockets[socket];
          $socket.on(event, cb.bind(null, $socket));
        }
      }
    });

    this.on(event, cb);

    return this;
  }

  // Remove a listener

  unlisten(event, cb): WebRockets {
    if (!this.listeners[event]) {
      return this;
    }

    this.listeners[event] = this.listeners[event].filter(fn => fn !== cb);

    // If unlisten is called when there are already clients connected
    //  then these clients might still be listening
    // - so we'll make them unlisten here

    process.nextTick(() => {
      if (this.io.sockets) {
        for (let socket in this.io.sockets.sockets) {
          this.io.sockets.sockets[socket].off(event, cb);
        }
      }
    });

    this.removeListener(event, cb);

    return this;
  }
}
