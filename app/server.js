'use strict';

import SocketIO             from 'socket.io';
import { EventEmitter }     from 'events';
import http                 from 'http';

class WebRockets extends EventEmitter {

  // messages we are listening to

  listeners = {};

  // list of sockets (clients) connected to server

  sockets = [];

  // 0 for server down, 1 for server up

  status = 0;

  /** Constructor - Start a new Socket.io server
   *
   *  @arg {HttpServer} server - the HTTP server to attach the Socket server to
   */

  constructor (server) {
    super();

    // If no HTTP server is given, we'll spring one
    if ( ! server ) {
      this.server = http.createServer();
      this.server.listen();
    }

    else {
      this.server = server;
    }

    // Starting socket server
    // (we use next tick to make sure EventEmitter can emit)
    process.nextTick(this.start.bind(this));

    // Once server is up, change status to reflect that
    this.on('listening', () => { this.status = 1 });

    // Ditto for server downº
    this.on('stopped', () => { this.status = 0 });
  }

  // The actual function that starts the server

  start () {
    this.io = SocketIO.listen(this.server);

    this.emit('listening');

    this.io
      .on('error',          this.emit.bind(this, 'error'))
      .on('connection',     this.client.bind(this))
      .use((socket, next) => {
        // add new client to  list of clients
        this.sockets.push(socket);
        next();
      });
  }

  // Gracefully stop the socket server

  stop () {
    return new Promise((pass, fail) => {

      this.emit('stopping');

      // If no clients, stop server now

      if ( ! this.sockets.length ) {
        return pass();
      }

      // Disconnect each socket asynchronously

      const promises = this.sockets.map(socket => new Promise((pass, fail) => {
        if ( ! socket.connected ) {
          return pass();
        }

        socket
          .on('disconnect',pass)
          .disconnect(true);
      }));

      // Once all sockets are disconnected

      Promise.all(promises)
        .then(() => {
          this.emit('stopped');
          pass();
        })
        .catch(fail);
    });
  }

  // To be called on each client connection

  client (socket) {
    // Handle disconnects - remove socket from list of sockets
    socket.on('disconnect', () =>
      this.sockets = this.sockets.filter($socket => $socket.id !== socket.id)
    );

    // Attach event listeners to client
    for ( let event in this.listeners ) {
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

  listen(event, cb) {
    if ( ! this.listeners[event] ) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(cb);

    // If listen is called when there are already clients connected
    //  then these clients are not listening - so we'll make them listen here

    process.nextTick(() => {
      if ( this.status && this.io.sockets ) {
        for ( let socket in this.io.sockets.sockets ) {
          const $socket = this.io.sockets.sockets[socket];
          $socket.on(event, cb.bind(null, $socket));
        }
      }
    });

    return this;
  }

  // Remove a listener

  unlisten(event, cb) {
    if ( ! this.listeners[event] ) {
      return this;
    }

    this.listeners[event] = this.listeners[event].filter(fn => fn !== cb);

    // If unlisten is called when there are already clients connected
    //  then these clients might still be listening
    // - so we'll make them unlisten here

    process.nextTick(() => {
      if ( this.io.sockets ) {
        for ( let socket in this.io.sockets.sockets ) {
          this.io.sockets.sockets[socket].off(event, cb);
        }
      }
    });

    return this;
  }
}

export default WebRockets;
