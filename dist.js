'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _events = require('events');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var WebRockets = function (_EventEmitter) {
  _inherits(WebRockets, _EventEmitter);

  function WebRockets(server) {
    _classCallCheck(this, WebRockets);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(WebRockets).call(this));

    _this._listeners = {};
    _this.status = 0;

    _this.server = server;
    process.nextTick(_this.start.bind(_this));
    _this.on('listening', function () {
      _this.status = 1;
    });
    return _this;
  }

  _createClass(WebRockets, [{
    key: 'start',
    value: function start() {
      this.io = _socket2.default.listen(this.server);
      this.emit('listening');
      this.io.on('error', this.emit.bind(this, 'error')).on('connection', this.client.bind(this));
    }
  }, {
    key: 'client',
    value: function client(socket) {
      var _this2 = this;

      socket.emit('Welcome!');

      var _loop = function _loop(event) {
        _this2._listeners[event].forEach(function (cb) {
          return socket.on(event, function () {
            for (var _len = arguments.length, messages = Array(_len), _key = 0; _key < _len; _key++) {
              messages[_key] = arguments[_key];
            }

            return cb.apply(undefined, [socket].concat(messages));
          });
        });
      };

      for (var event in this._listeners) {
        _loop(event);
      }
    }
  }, {
    key: 'addListener',
    value: function addListener(event, cb) {
      var _this3 = this;

      if (!this._listeners[event]) {
        this._listeners[event] = [];
      }

      this._listeners[event].push(cb);

      process.nextTick(function () {
        if (_this3.status && _this3.io.sockets) {
          var _loop2 = function _loop2(socket) {
            _this3.io.sockets.sockets[socket].on(event, function () {
              for (var _len2 = arguments.length, messages = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                messages[_key2] = arguments[_key2];
              }

              return cb.apply(undefined, [_this3.io.sockets.sockets[socket]].concat(messages));
            });
          };

          for (var socket in _this3.io.sockets.sockets) {
            _loop2(socket);
          }
        } else {}
      });
    }
  }]);

  return WebRockets;
}(_events.EventEmitter);

exports.default = WebRockets;
