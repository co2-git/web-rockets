'use strict';

import SocketIO             from 'socket.io';
import { EventEmitter }     from 'events';

class WebRockets extends EventEmitter {

  _listeners = {};

  status = 0;

  constructor (server) {
    super();
    this.server = server;
    process.nextTick(this.start.bind(this));
    this.on('listening', () => { this.status = 1 });
  }

  start () {
    this.io = SocketIO.listen(this.server);
    this.emit('listening');
    this.io
      .on('error',          this.emit.bind(this, 'error'))
      .on('connection',     this.client.bind(this));
  }

  client (socket) {
    socket.emit('Welcome!');

    for ( let event in this._listeners ) {
      this._listeners[event].forEach(cb => socket.on(event, (...messages) => cb(socket, ...messages)));
    }
  }

  use (middleware) {
    this.io.use(middleware);
    return this;
  }

  listen(event, cb) {
    if ( ! this._listeners[event] ) {
      this._listeners[event] = [];
    }

    this._listeners[event].push(cb);

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
    if ( ! this._listeners[event] ) {
      return this;
    }

    this._listeners[event] = this._listeners[event].filter(fn => fn !== cb);

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
