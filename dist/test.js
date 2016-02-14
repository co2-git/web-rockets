'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = require('events');

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _redtea = require('redtea');

var _redtea2 = _interopRequireDefault(_redtea);

var _should = require('should');

var _should2 = _interopRequireDefault(_should);

var _server = require('./server');

var _server2 = _interopRequireDefault(_server);

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function test() {
  var props = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var locals = {
    server: new _server2.default(),
    serverError: null,
    serverListening: false
  };

  locals.server.on('error', function (error) {
    locals.serverError = error;
  }).on('listening', function () {
    locals.serverListening = true;
  });

  return (0, _redtea2.default)('Web Rockets v' + _package2.default.version, function (it) {

    it('should be a class', function () {
      return _server2.default.should.be.a.Function();
    });

    it('Instantiate', function (it) {
      it('should be an instance of EventEmitter', function () {
        return locals.server.should.be.an.instanceof(_events.EventEmitter);
      });

      it('should have a http server', function () {
        return locals.server.should.have.property('server').which.is.an.instanceof(_http2.default.Server);
      });

      it('should not have error', function () {
        return (0, _should2.default)(locals.serverError).be.null();
      });

      it('should be listening', function () {
        return new Promise(function (ok, ko) {
          if (locals.serverListening) {
            return ok();
          }
          var started = undefined;
          locals.server.on('listening', function () {
            started = true;
            ok();
          });
          setTimeout(function () {
            if (!started) {
              ko(new Error('Server still not started'));
            }
          }, 2500);
        });
      });

      it('should stop', function () {
        return new Promise(function (ok, ko) {
          locals.server.stop().then(ok, ko);
        });
      });
    });

    it('.use()', function (it) {
      it('use use()', function () {
        locals.server = new _server2.default().use(function (socket, next) {
          socket.foo = true;
          next();
        });
      });
    });
  });
}

exports.default = test;