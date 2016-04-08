'use strict';

import { assert } from 'chai';

import * as router from '../lib/router';

describe('router', function() {
	
	describe('parseRoute', function() {
		it('must return undefined when path not provided', function() {
			
			const pathsList = [ undefined, null, ''];	
            	
			let actual;
			
			for (let path of pathsList) {
                	
				actual = router.parseRoute(path);
		
				assert.isUndefined(actual);
			}
		});	
		it('must return the correct pattern and group names', function() {
			
			const sample = [ 
                {
                    path: '/users/anonymous/page/default',
                    caseSensitive: false,
                    strict: false,
                    
                    expected: {
                        pattern: new RegExp(`^/users/anonymous/page/default$`, 'i'),
                        keys: []
                    },
                },
                {
                    path: '/users/`userId`/`page`/default/',
                    caseSensitive: false,
                    strict: false,
                    
                    expected: {
                        pattern: new RegExp(`^/users/${router.defaultPathPattern}/${router.defaultPathPattern}/default$`, 'i'),
                        keys: ['userId', 'page']
                    },
                },
                {
                    path: '/users/`userId`/`page`/default',
                    caseSensitive: true,
                    strict: false,
                    
                    expected: {
                        pattern: new RegExp(`^/users/${router.defaultPathPattern}/${router.defaultPathPattern}/default$`),
                        keys: ['userId', 'page']
                    }
                },
                {
                    path: '/users/`userId`/`page`/default',
                    caseSensitive: false,
                    strict: true,
                    
                    expected: {
                        pattern: new RegExp(`^/users/${router.defaultPathPattern}/${router.defaultPathPattern}/default$`, 'i'),
                        keys: ['userId', 'page']
                    }
                },
                {
                    path: '/users/`userId`/`page`/default/',
                    caseSensitive: true,
                    strict: true,
                    
                    expected: {
                        pattern: new RegExp(`^/users/${router.defaultPathPattern}/${router.defaultPathPattern}/default/$`),
                        keys: ['userId', 'page']
                    }
                },
                {
                    path: '/users/`userId \\d+`/`page`/default',
                    caseSensitive: false,
                    strict: false,
                    
                    expected: {
                        pattern: new RegExp(`^/users/(\\d+)/${router.defaultPathPattern}/default$`, 'i'),
                        keys: ['userId', 'page']
                    },
                },   
                {
                    path: '/users/`userId \\d+`/`page \\w{8, 10}`/default',
                    caseSensitive: false,
                    strict: false,
                    
                    expected: {
                        pattern: new RegExp(`^/users/(\\d+)/(\\w{8, 10})/default$`, 'i'),
                        keys: ['userId', 'page']
                    },
                }, 
                {
                    path: '/users/`userId \\d+`/view-`page \\w{8, 10}`/default',
                    caseSensitive: false,
                    strict: false,
                    
                    expected: {
                        pattern: new RegExp(`^/users/(\\d+)/view-(\\w{8, 10})/default$`, 'i'),
                        keys: ['userId', 'page']
                    }
                }
            ];		

            let actual;
            
			for (let item of sample) {
                	
				actual = router.parseRoute(item.path, item.caseSensitive, item.strict);
                		
                assert.equal(actual.pattern.source, item.expected.pattern.source);
                assert.equal(actual.pattern.flags, item.expected.pattern.flags);
				assert.sameMembers(actual.keys, item.expected.keys);
			}
		});		
	});

	describe('findRoute', function() {
		it('must return undefined when routes not provided', function() {
			
            const appSettings = {};
			const routesList = [ undefined, null, []];	
            const request = {};
            	
			let actual;
			
			for (let routes of routesList) {
                	
				actual = router.findRoute(appSettings, routes, request);
		
				assert.isUndefined(actual);
			}
		});	
		it('must return undefined when request url not provided', function() {
			
            const appSettings = {};
			const routes = [{}];	
            const requestsList = [ undefined, null, {}];
            	
			let actual;
			
			for (let request of requestsList) {
                	
				actual = router.findRoute(appSettings, routes, request);
		
				assert.isUndefined(actual);
			}
		});	
		it('must return undefined when route not found', function() {
			
            const appSettings = {
                route: {
                    strict: false
                }
            };
			const routes = [
                {
                    pattern: new RegExp(`^/users/(\\d+)/view-(\\w{7,9})$`, 'i'),
                    keys: ['userId', 'page'],
                    httpMethods: [ 'get' ]
                },
                {
                    pattern: new RegExp(`^/users/(\\d+)/(\\w{7,9})$`, 'i'),
                    keys: ['userId', 'page'],
                    httpMethods: [ 'get' ]
                },
                {
                    pattern: new RegExp(`^/users/(\\d+)/view-(\\w{7,9})$`, 'i'),
                    keys: ['userId', 'page'],
                    httpMethods: [ 'post' ]
                },
                {
                    pattern: new RegExp(`^/usersList/(\\d+)/view-(\\w{7,9})$`),
                    keys: ['userId', 'page'],
                    httpMethods: [ 'get' ]
                }
            ];	
            const request = {
                    method: 'POST',
                    url: 'http://www.allmy.sites.com/users/649/view-settingsSection',
                    headers: { }
                };
            	
            const actual = router.findRoute(appSettings, routes, request);
    
            assert.isUndefined(actual);
		});		
		it('must match the correct route', function() {
			
            const appSettings = {
                route: {
                    strict: false
                }
            };
			const routes = [
                {
                    pattern: new RegExp(`^/users/(\\d+)/view-(\\w{7,9})$`, 'i'),
                    keys: ['userId', 'page'],
                    httpMethods: [ 'post' ]
                },
                {
                    pattern: new RegExp(`^/usersList/(\\d+)/view-(\\w{7,9})$`, 'i'),
                    keys: ['userId', 'page'],
                    httpMethods: [ 'get' ]
                },
                {
                    pattern: new RegExp(`^/users/(\\d+)/view-(\\w{7,9})$`, 'i'),
                    keys: ['userId', 'page'],
                    httpMethods: [ 'get' ]
                },
                {
                    pattern: new RegExp(`^/usersList/(\\d+)/view-(\\w{7,9})$`, 'i'),
                    keys: ['userId', 'page'],
                    httpMethods: [ 'post' ]
                }
            ];	
            const request = {
                method: 'GET',
                url: 'http://www.allmy.sites.com/users/649/view-settings',
                headers: { }
            };
            	
            const actual = router.findRoute(appSettings, routes, request);
    
            assert.isObject(actual);
            assert.deepEqual(actual.route, routes[2]);
            
            const actualParamsKeys = Object.keys(actual.params);
            
            assert.deepEqual(actualParamsKeys, ['userId', 'page']);
            assert.equal(actual.params['userId'], 649);
            assert.equal(actual.params['page'], 'settings');
		});
		it('must return undefined when content type not allowed', function() {
			
            const appSettings = {
                route: {
                    strict: false
                }
            };
			const routes = [
                {
                    pattern: new RegExp(`^/users/(\\d+)/view-(\\w{7,9})$`, 'i'),
                    keys: ['userId', 'page'],
                    httpMethods: [ 'get' ],
                    consumes: ['application/json']
                }
            ];	
            const request = {
                method: 'GET',
                url: 'http://www.allmy.sites.com/users/649/view-settings',
                headers: {
                    'content-type': 'text/html',
                    'transfer-encoding': 'chunked'
                }
            };
            	
            const actual = router.findRoute(appSettings, routes, request);
    
            assert.isUndefined(actual);
		});
		it('must match the correct route when content type is allowed', function() {
			
            const appSettings = {
                route: {
                    strict: false
                }
            };
			const routes = [
                {
                    pattern: new RegExp(`^/users/(\\d+)/view-(\\w{7,9})$`, 'i'),
                    keys: ['userId', 'page'],
                    httpMethods: [ 'get' ],
                    consumes: ['text/html']
                }
            ];	
            const request = {
                method: 'GET',
                url: 'http://www.allmy.sites.com/users/649/view-settings',
                headers: {
                    'content-type': 'text/html',
                    'transfer-encoding': 'chunked'
                }
            };
            
            const actual = router.findRoute(appSettings, routes, request);
    
            assert.isObject(actual);
            assert.deepEqual(actual.route, routes[0]);
            
            const actualParamsKeys = Object.keys(actual.params);
            
            assert.deepEqual(actualParamsKeys, ['userId', 'page']);
            assert.equal(actual.params['userId'], 649);
            assert.equal(actual.params['page'], 'settings');
		});
		it('must return undefined when accept not allowed', function() {
			
            const appSettings = {
                route: {
                    strict: false
                }
            };
			const routes = [
                {
                    pattern: new RegExp(`^/users/(\\d+)/view-(\\w{7,9})$`, 'i'),
                    keys: ['userId', 'page'],
                    httpMethods: [ 'get' ],
                    produces: ['application/json']
                }
            ];	
            const request = {
                method: 'GET',
                url: 'http://www.allmy.sites.com/users/649/view-settings',
                headers: {
                    'accept': 'text/html'
                }
            };
            	
            const actual = router.findRoute(appSettings, routes, request);
    
            assert.isUndefined(actual);
		});
		it('must match the correct route when accept is allowed', function() {
			
            const appSettings = {
                route: {
                    strict: false
                }
            };
			const routes = [
                {
                    pattern: new RegExp(`^/users/(\\d+)/view-(\\w{7,9})$`, 'i'),
                    keys: ['userId', 'page'],
                    httpMethods: [ 'get' ],
                    produces: ['text/html']
                }
            ];	
            const request = {
                method: 'GET',
                url: 'http://www.allmy.sites.com/users/649/view-settings',
                headers: {
                    'accept': 'text/html'
                }
            };
            	
            const actual = router.findRoute(appSettings, routes, request);
    
            assert.isObject(actual);
            assert.deepEqual(actual.route, routes[0]);
            
            const actualParamsKeys = Object.keys(actual.params);
            
            assert.deepEqual(actualParamsKeys, ['userId', 'page']);
            assert.equal(actual.params['userId'], 649);
            assert.equal(actual.params['page'], 'settings');
		});
		it('must return undefined when accept-version not allowed', function() {
			
            const appSettings = {
                route: {
                    strict: false
                }
            };
			const routes = [
                {
                    pattern: new RegExp(`^/users/(\\d+)/view-(\\w{7,9})$`, 'i'),
                    keys: ['userId', 'page'],
                    httpMethods: [ 'get' ],
                    version: '3.1.6'
                }
            ];	
            const request = {
                method: 'GET',
                url: 'http://www.allmy.sites.com/users/649/view-settings',
                headers: {
                    'accept-version': '>3.2.5'
                }
            };
            	
            const actual = router.findRoute(appSettings, routes, request);
    
            assert.isUndefined(actual);
		});
		it('must match the correct route when accept-version is allowed', function() {
			
            const appSettings = {
                route: {
                    strict: false
                }
            };
			const routes = [
                {
                    pattern: new RegExp(`^/users/(\\d+)/view-(\\w{7,9})$`, 'i'),
                    keys: ['userId', 'page'],
                    httpMethods: [ 'get' ],
                    version: '3.5.6'
                }
            ];	
            const request = {
                method: 'GET',
                url: 'http://www.allmy.sites.com/users/649/view-settings',
                headers: {
                    'accept-version': '>3.2.5'
                }
            };
            	
            const actual = router.findRoute(appSettings, routes, request);
    
            assert.isObject(actual);
            assert.deepEqual(actual.route, routes[0]);
            
            const actualParamsKeys = Object.keys(actual.params);
            
            assert.deepEqual(actualParamsKeys, ['userId', 'page']);
            assert.equal(actual.params['userId'], 649);
            assert.equal(actual.params['page'], 'settings');
		});
    });	
});