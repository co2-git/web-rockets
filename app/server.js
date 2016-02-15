'use strict';

import SocketIO             from 'socket.io';
import { EventEmitter }     from 'events';
import http                 from 'http';

class WebRockets extends EventEmitter {

  listeners = {};

  sockets = {};

  status = 0;

  constructor (server) {
    super();

    if ( ! server ) {
      this.server = http.createServer();
      this.server.listen();
    }

    else {
      this.server = server;
    }

    process.nextTick(this.start.bind(this));

    this.on('listening', () => { this.status = 1 });
  }

  start () {
    this.io = SocketIO.listen(this.server);
    this.emit('listening');
    this.io
      .on('error',          this.emit.bind(this, 'error'))
      .on('connection',     this.client.bind(this))
      .use((socket, next) => {
        this.sockets.push(socket);
        next();
      });
  }

  stop () {
    return new Promise((ok, ko) => {

      if ( ! this.sockets.length ) {
        return ok();
      }

      const promises = this.sockets.map(socket => new Promise((ok, ko) => {
        if ( ! socket.connected ) {
          return ok();
        }

        socket
          .on('disconnect',ok)
          .disconnect(true);
      }));

      Promise.all(promises).then(ok, ko);
    });
  }

  client (socket) {
    socket.emit('Welcome!');

    socket.on('disconnect', () =>
      this.sockets = this.sockets.filter($socket => $socket.id !== socket.id)
    );

    for ( let event in this.listeners ) {
      this.listeners[event].forEach(cb => socket.on(event, (...messages) => cb(socket, ...messages)));
    }
  }

  use (middleware) {
    process.nextTick(() => this.io.use(middleware));
    return this;
  }

  listen(event, cb) {
    if ( ! this.listeners[event] ) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(cb);

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

  unlisten(event, cb) {
    if ( ! this.listeners[event] ) {
      return this;
    }

    this.listeners[event] = this.listeners[event].filter(fn => fn !== cb);

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
