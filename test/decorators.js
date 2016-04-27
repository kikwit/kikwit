'use strict';

import * as helpers from './support/helpers'

import * as config from '../lib/config';
import { action, after, before, bodyParser, consumes, controller, get, post, produces, queryParser } from '../lib';

beforeEach(function(){
    jasmine.addMatchers(helpers.customMatchers);
});

describe('decorators', function () {
  
  describe('@after', function () {
    describe('class', function () {
      it(`should set the correct value for [${Symbol.keyFor(config.afterProp)}] property on class`, function () {

        let clazz = class {};
        let handlers = [() => {}, () => {}];
        let fn = after(...handlers);

        fn(clazz);

        expect(handlers).toDeepEqual(clazz[config.afterProp]);
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

        expect(clazz[config.afterProp]).toBeUndefined();
        expect(handlers).toDeepEqual(descriptor.value[config.afterProp]);
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

         expect(handlers).toDeepEqual(clazz[config.beforeProp]);
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

        expect(clazz[config.beforeProp]).toBeUndefined();
        expect(handlers).toDeepEqual(descriptor.value[config.beforeProp]);
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

        expect(parser).toEqual(clazz[config.bodyParserProp]);
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

        expect(clazz[config.bodyParser]).toBeUndefined();
        expect(parser).toDeepEqual(descriptor.value[config.bodyParserProp]);
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

         expect(mimeTypes).toDeepEqual(clazz[config.consumesProp]);
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

        expect(clazz[config.consumesProp]).toBeUndefined();
        expect(mimeTypes).toDeepEqual(descriptor.value[config.consumesProp]);
      });
    });
  });

  describe('@controller', function () {
    it(`should set the correct value for [${Symbol.keyFor(config.controllerTag)}] property on class`, function () {

      let clazz = class clazz{};
      
      controller(clazz);

      expect(clazz[config.controllerTag]).toBe(true);
    });
    it(`should throw on anonymous class`, function () {

      let clazz = class {};
      let fn = () => controller(clazz);
      
      expect(fn).toThrowError('Anonymous controllers not supported');
    });
  });
  
  describe('@produces', function () {
    describe('class', function () {
      it(`should set the correct value for [${Symbol.keyFor(config.producesProp)}] property on class`, function () {

        let clazz = class {};
        let mimeTypes = ['text/plain', 'application/json', 'xml'];
        let fn = produces(...mimeTypes);

        fn(clazz);

        expect(mimeTypes).toDeepEqual(clazz[config.producesProp]);
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

        expect(clazz[config.producesProp]).toBeUndefined();
        expect(mimeTypes).toDeepEqual(descriptor.value[config.producesProp]);
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

        expect(parser).toEqual(clazz[config.queryParserProp]);
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

        expect(clazz[config.queryParser]).toBeUndefined();
        expect(parser).toDeepEqual(descriptor.value[config.queryParserProp]);
      });
    });
  });  
 
});
