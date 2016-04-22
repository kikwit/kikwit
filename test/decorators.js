'use strict';
/*
import { assert } from 'chai';

import * as config from '../lib/config';
import { action, after, before, bodyParser, consumes, controller, get, post, produces, queryParser } from '../lib';

describe('decorators', function () {
  
  describe('@after', function () {
    describe('class', function () {
      it(`should set the correct value for [${Symbol.keyFor(config.afterProp)}] property on class`, function () {

        let clazz = class {};
        let handlers = [() => {}, () => {}];
        let fn = after(...handlers);

        fn(clazz);

        assert.deepEqual(handlers, clazz[config.afterProp]);
      });
    });
    describe('method', function () {
      it(`should set the correct value for [${Symbol.keyFor(config.afterProp)}] property on method`, function () {

        let clazz = class {};
        let descriptor = {
          value: function () {}
        };
        let handlers = [() => {}, () => {}];
        let fn = after(...handlers);

        fn(clazz, 'any', descriptor);

        assert.notProperty(clazz, config.afterProp);
        assert.deepEqual(handlers, descriptor.value[config.afterProp]);
      });
    });
  });  
  
  describe('@before', function () {
    describe('class', function () {
      it(`should set the correct value for [${Symbol.keyFor(config.beforeProp)}] property on class`, function () {

        let clazz = class {};
        let handlers = [() => {}, () => {}];
        let fn = before(...handlers);

        fn(clazz);

        assert.deepEqual(handlers, clazz[config.beforeProp]);
      });
    });
    describe('method', function () {
      it(`should set the correct value for [${Symbol.keyFor(config.beforeProp)}] property on method`, function () {

        let clazz = class {};
        let descriptor = {
          value: function () {}
        };
        let handlers = [() => {}, () => {}];
        let fn = before(...handlers);

        fn(clazz, 'any', descriptor);

        assert.notProperty(clazz, config.beforeProp);
        assert.deepEqual(handlers, descriptor.value[config.beforeProp]);
      });
    });
  });   
  
  describe('@bodyParser', function () {
    describe('class', function () {
      it(`should set the correct value for [${Symbol.keyFor(config.bodyParserProp)}] property on class`, function () {

        let clazz = class {};
        let parser = (ctx) => {};
        let fn = bodyParser(parser);

        fn(clazz);

        assert.equal(parser, clazz[config.bodyParserProp]);
      });
    });
    describe('method', function () {
      it(`should set the correct value for [${Symbol.keyFor(config.bodyParserProp)}] property on method`, function () {

        let clazz = class {};
        let descriptor = {
          value: function () {}
        };
        let parser = (ctx) => {};
        let fn = bodyParser(parser);

        fn(clazz, 'any', descriptor);

        assert.notProperty(clazz, config.bodyParser);
        assert.deepEqual(parser, descriptor.value[config.bodyParserProp]);
      });
    });
  }); 
  
  describe('@consumes', function () {
    describe('class', function () {
      it(`should set the correct value for [${Symbol.keyFor(config.consumesProp)}] property on class`, function () {

        let clazz = class {};
        let mimeTypes = ['text/plain', 'application/json', 'xml'];
        let fn = consumes(...mimeTypes);

        fn(clazz);

        assert.deepEqual(mimeTypes, clazz[config.consumesProp]);
      });
    });
    describe('method', function () {
      it(`should set the correct value for [${Symbol.keyFor(config.consumesProp)}] property on method`, function () {

        let clazz = class {};
        let descriptor = {
          value: function () {}
        };
        let mimeTypes = [];
        let fn = consumes(...mimeTypes);

        fn(clazz, 'any', descriptor);

        assert.notProperty(clazz, config.consumesProp);
        assert.deepEqual(mimeTypes, descriptor.value[config.consumesProp]);
      });
    });
  });

  describe('@controller', function () {
    it(`should set the correct value for [${Symbol.keyFor(config.controllerTag)}] property on class`, function () {

      let clazz = class clazz{};
      
      controller(clazz);

      assert.propertyVal(clazz, config.controllerTag, true);
    });
    it(`should throw on anonymous class`, function () {

      let clazz = class {};
      let fn = () => controller(clazz);
      
      assert.throws(fn, 'Anonymous controllers not supported');
    });
  });
  
  describe('@produces', function () {
    describe('class', function () {
      it(`should set the correct value for [${Symbol.keyFor(config.producesProp)}] property on class`, function () {

        let clazz = class {};
        let mimeTypes = ['text/plain', 'application/json', 'xml'];
        let fn = produces(...mimeTypes);

        fn(clazz);

        assert.deepEqual(mimeTypes, clazz[config.producesProp]);
      });
    });
    describe('method', function () {
      it(`should set the correct value for [${Symbol.keyFor(config.producesProp)}] property on method`, function () {

        let clazz = class {};
        let descriptor = {
          value: function () { }
        };
        let mimeTypes = [];
        let fn = produces(...mimeTypes);

        fn(clazz, 'any', descriptor);

        assert.notProperty(clazz, config.producesProp);
        assert.deepEqual(mimeTypes, descriptor.value[config.producesProp]);
      });
    });
  });
  
  describe('@queryParser', function () {
    describe('class', function () {
      it(`should set the correct value for [${Symbol.keyFor(config.queryParserProp)}] property on class`, function () {

        let clazz = class {};
        let parser = (str) => {};
        let fn = queryParser(parser);

        fn(clazz);

        assert.equal(parser, clazz[config.queryParserProp]);
      });
    });
    describe('method', function () {
      it(`should set the correct value for [${Symbol.keyFor(config.queryParserProp)}] property on method`, function () {

        let clazz = class {};
        let descriptor = {
          value: function () {}
        };
        let parser = (str) => {};
        let fn = queryParser(parser);

        fn(clazz, 'any', descriptor);

        assert.notProperty(clazz, config.queryParser);
        assert.deepEqual(parser, descriptor.value[config.queryParserProp]);
      });
    });
  });  
 
});

*/