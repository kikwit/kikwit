'use strict';

import * as helpers from './support/helpers'

import * as configurer from '../lib/configurer';
import { action, after, before, bodyParser, consumes, controller, get, post, produces, queryParser } from '../lib';

beforeEach(function(){
    jasmine.addMatchers(helpers.customMatchers);
});

describe('decorators', function () {
  
  describe('@after', function () {
    describe('class', function () {
      it(`should set the correct value for [${Symbol.keyFor(configurer.afterProp)}] property on class`, function () {

        let clazz = class {};
        let handlers = [() => {}, () => {}];
        let fn = after(...handlers);

        fn(clazz);

        expect(handlers).toDeepEqual(clazz[configurer.afterProp]);
      });
    });
    describe('method', function () {
      it(`should set the correct value for [${Symbol.keyFor(configurer.afterProp)}] property on method`, function () {

        let clazz = class {};
        let descriptor = {
          value: function () {}
        };
        let handlers = [() => {}, () => {}];
        let fn = after(...handlers);

        fn(clazz, 'any', descriptor);

        expect(clazz[configurer.afterProp]).toBeUndefined();
        expect(handlers).toDeepEqual(descriptor.value[configurer.afterProp]);
      });
    });
  });  
  
  describe('@before', function () {
    describe('class', function () {
      it(`should set the correct value for [${Symbol.keyFor(configurer.beforeProp)}] property on class`, function () {

        let clazz = class {};
        let handlers = [() => {}, () => {}];
        let fn = before(...handlers);

        fn(clazz);

         expect(handlers).toDeepEqual(clazz[configurer.beforeProp]);
      });
    });
    describe('method', function () {
      it(`should set the correct value for [${Symbol.keyFor(configurer.beforeProp)}] property on method`, function () {

        let clazz = class {};
        let descriptor = {
          value: function () {}
        };
        let handlers = [() => {}, () => {}];
        let fn = before(...handlers);

        fn(clazz, 'any', descriptor);

        expect(clazz[configurer.beforeProp]).toBeUndefined();
        expect(handlers).toDeepEqual(descriptor.value[configurer.beforeProp]);
      });
    });
  });   
  
  describe('@bodyParser', function () {
    describe('class', function () {
      it(`should set the correct value for [${Symbol.keyFor(configurer.bodyParserProp)}] property on class`, function () {

        let clazz = class {};
        let parser = (ctx) => {};
        let fn = bodyParser(parser);

        fn(clazz);

        expect(parser).toEqual(clazz[configurer.bodyParserProp]);
      });
    });
    describe('method', function () {
      it(`should set the correct value for [${Symbol.keyFor(configurer.bodyParserProp)}] property on method`, function () {

        let clazz = class {};
        let descriptor = {
          value: function () {}
        };
        let parser = (ctx) => {};
        let fn = bodyParser(parser);

        fn(clazz, 'any', descriptor);

        expect(clazz[configurer.bodyParser]).toBeUndefined();
        expect(parser).toDeepEqual(descriptor.value[configurer.bodyParserProp]);
      });
    });
  }); 
  
  describe('@consumes', function () {
    describe('class', function () {
      it(`should set the correct value for [${Symbol.keyFor(configurer.consumesProp)}] property on class`, function () {

        let clazz = class {};
        let mimeTypes = ['text/plain', 'application/json', 'xml'];
        let fn = consumes(...mimeTypes);

        fn(clazz);

         expect(mimeTypes).toDeepEqual(clazz[configurer.consumesProp]);
      });
    });
    describe('method', function () {
      it(`should set the correct value for [${Symbol.keyFor(configurer.consumesProp)}] property on method`, function () {

        let clazz = class {};
        let descriptor = {
          value: function () {}
        };
        let mimeTypes = [];
        let fn = consumes(...mimeTypes);

        fn(clazz, 'any', descriptor);

        expect(clazz[configurer.consumesProp]).toBeUndefined();
        expect(mimeTypes).toDeepEqual(descriptor.value[configurer.consumesProp]);
      });
    });
  });

  describe('@controller', function () {
    it(`should set the correct value for [${Symbol.keyFor(configurer.controllerTag)}] property on class`, function () {

      let clazz = class clazz{};
      
      controller(clazz);

      expect(clazz[configurer.controllerTag]).toBe(true);
    });
    it(`should throw on anonymous class`, function () {

      let clazz = class {};
      let fn = () => controller(clazz);
      
      expect(fn).toThrowError('Anonymous controllers not supported');
    });
  });
  
  describe('@produces', function () {
    describe('class', function () {
      it(`should set the correct value for [${Symbol.keyFor(configurer.producesProp)}] property on class`, function () {

        let clazz = class {};
        let mimeTypes = ['text/plain', 'application/json', 'xml'];
        let fn = produces(...mimeTypes);

        fn(clazz);

        expect(mimeTypes).toDeepEqual(clazz[configurer.producesProp]);
      });
    });
    describe('method', function () {
      it(`should set the correct value for [${Symbol.keyFor(configurer.producesProp)}] property on method`, function () {

        let clazz = class {};
        let descriptor = {
          value: function () { }
        };
        let mimeTypes = [];
        let fn = produces(...mimeTypes);

        fn(clazz, 'any', descriptor);

        expect(clazz[configurer.producesProp]).toBeUndefined();
        expect(mimeTypes).toDeepEqual(descriptor.value[configurer.producesProp]);
      });
    });
  });
  
  describe('@queryParser', function () {
    describe('class', function () {
      it(`should set the correct value for [${Symbol.keyFor(configurer.queryParserProp)}] property on class`, function () {

        let clazz = class {};
        let parser = (str) => {};
        let fn = queryParser(parser);

        fn(clazz);

        expect(parser).toEqual(clazz[configurer.queryParserProp]);
      });
    });
    describe('method', function () {
      it(`should set the correct value for [${Symbol.keyFor(configurer.queryParserProp)}] property on method`, function () {

        let clazz = class {};
        let descriptor = {
          value: function () {}
        };
        let parser = (str) => {};
        let fn = queryParser(parser);

        fn(clazz, 'any', descriptor);

        expect(clazz[configurer.queryParser]).toBeUndefined();
        expect(parser).toDeepEqual(descriptor.value[configurer.queryParserProp]);
      });
    });
  });  
 
});
