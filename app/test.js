'use strict';

import { EventEmitter }     from 'events';
import http                 from 'http';
import describe             from 'redtea';
import should               from 'should';
import WebRockets           from './server';
import json                 from '../package.json';

function test (props = {}) {
  const locals = {
    server : new WebRockets(),
    serverError : null,
    serverListening : false
  };

  locals.server
    .on('error', error => { locals.serverError = error })
    .on('listening', () => { locals.serverListening = true });

  return describe(`Web Rockets v${json.version}`, it => {

    it('should be a class', () => WebRockets.should.be.a.Function());

    it('Instantiate', it => {
      it('should be an instance of EventEmitter', () =>
        locals.server.should.be.an.instanceof(EventEmitter)
      );

      it('should have a http server', () =>
        locals.server.should.have.property('server')
          .which.is.an.instanceof(http.Server)
      );

      it('should not have error', () =>
        should(locals.serverError).be.null()
      );

      it('should be listening', () => new Promise((ok, ko) => {
        if ( locals.serverListening ) {
          return ok();
        }
        let started;
        locals.server.on('listening', () => {
          started = true;
          ok();
        });
        setTimeout(() => {
          if ( ! started ) {
            ko(new Error('Server still not started'));
          }
        }, 2500);
      }));

      it('should stop', () => new Promise((ok, ko) => {
        locals.server.stop().then(ok, ko);
      }));
    });

    it('.use()', it => {
      it('use use()', () => {
        locals.server = new WebRockets()
          .use((socket, next) => {
            socket.foo = true;
            next();
          });
      });
    });

  });
}

export default test;
