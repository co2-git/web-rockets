'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _events = require('events');

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var WebRockets = function (_EventEmitter) {
  _inherits(WebRockets, _EventEmitter);

  function WebRockets(server) {
    _classCallCheck(this, WebRockets);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(WebRockets).call(this));

    _this.listeners = {};
    _this.sockets = {};
    _this.status = 0;


    if (!server) {
      _this.server = _http2.default.createServer();
      _this.server.listen();
    } else {
      _this.server = server;
    }

    process.nextTick(_this.start.bind(_this));

    _this.on('listening', function () {
      _this.status = 1;
    });
    return _this;
  }

  _createClass(WebRockets, [{
    key: 'start',
    value: function start() {
      var _this2 = this;

      this.io = _socket2.default.listen(this.server);
      this.emit('listening');
      this.io.on('error', this.emit.bind(this, 'error')).on('connection', this.client.bind(this)).use(function (socket, next) {
        _this2.sockets.push(socket);
        next();
      });
    }
  }, {
    key: 'stop',
    value: function stop() {
      var _this3 = this;

      return new Promise(function (ok, ko) {

        if (!_this3.sockets.length) {
          return ok();
        }

        var promises = _this3.sockets.map(function (socket) {
          return new Promise(function (ok, ko) {
            if (!socket.connected) {
              return ok();
            }

            socket.on('disconnect', ok).disconnect(true);
          });
        });

        Promise.all(promises).then(ok, ko);
      });
    }
  }, {
    key: 'client',
    value: function client(socket) {
      var _this4 = this;

      socket.emit('Welcome!');

      socket.on('disconnect', function () {
        return _this4.sockets = _this4.sockets.filter(function ($socket) {
          return $socket.id !== socket.id;
        });
      });

      var _loop = function _loop(event) {
        _this4.listeners[event].forEach(function (cb) {
          return socket.on(event, function () {
            for (var _len = arguments.length, messages = Array(_len), _key = 0; _key < _len; _key++) {
              messages[_key] = arguments[_key];
            }

            return cb.apply(undefined, [socket].concat(messages));
          });
        });
      };

      for (var event in this.listeners) {
        _loop(event);
      }
    }
  }, {
    key: 'use',
    value: function use(middleware) {
      var _this5 = this;

      process.nextTick(function () {
        return _this5.io.use(middleware);
      });
      return this;
    }
  }, {
    key: 'listen',
    value: function listen(event, cb) {
      var _this6 = this;

      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }

      this.listeners[event].push(cb);

      process.nextTick(function () {
        if (_this6.status && _this6.io.sockets) {
          for (var socket in _this6.io.sockets.sockets) {
            var $socket = _this6.io.sockets.sockets[socket];
            $socket.on(event, cb.bind(null, $socket));
          }
        }
      });

      return this;
    }
  }, {
    key: 'unlisten',
    value: function unlisten(event, cb) {
      var _this7 = this;

      if (!this.listeners[event]) {
        return this;
      }

      this.listeners[event] = this.listeners[event].filter(function (fn) {
        return fn !== cb;
      });

      process.nextTick(function () {
        if (_this7.io.sockets) {
          for (var socket in _this7.io.sockets.sockets) {
            _this7.io.sockets.sockets[socket].off(event, cb);
          }
        }
      });

      return this;
    }
  }]);

  return WebRockets;
}(_events.EventEmitter);

exports.default = WebRockets;