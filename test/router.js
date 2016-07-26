'use strict';

import * as helpers from './support/helpers'

import * as router from '../lib/router';

beforeEach(function(){
    jasmine.addMatchers(helpers.customMatchers);
});

describe('router', function() {
	
	describe('parseRoute', function() {
		it('must return undefined when path not provided', function() {
			
			const pathsList = [ undefined, null, ''];	
            	
			let actual;
			
			for (let path of pathsList) {
                	
				actual = router.parseRoute(path);
		
				expect(actual).toBeUndefined();
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
                    
                    patternString: `^/users/anonymous/page/default$`.toLocaleLowerCase()
                },
                {
                    path: '/users/:userId/:page/default/',
                    caseSensitive: false,
                    strict: false,
                    
                    expected: {
                        pattern: new RegExp(`^/users/(${router.defaultPathPattern})/(${router.defaultPathPattern})/default$`, 'i'),
                        keys: ['userId', 'page']
                    },
                    
                    patternString: `^/users/(${router.defaultPathPattern})/(${router.defaultPathPattern})/default$`.toLowerCase()
                },
                {
                    path: '/users/:userId/:page/default',
                    caseSensitive: true,
                    strict: false,
                    
                    expected: {
                        pattern: new RegExp(`^/users/(${router.defaultPathPattern})/(${router.defaultPathPattern})/default$`),
                        keys: ['userId', 'page']
                    },
                    
                    patternString: `^/users/(${router.defaultPathPattern})/(${router.defaultPathPattern})/default$`
                },
                {
                    path: '/users/:userId/:page/default',
                    caseSensitive: false,
                    strict: true,
                    
                    expected: {
                        pattern: new RegExp(`^/users/(${router.defaultPathPattern})/(${router.defaultPathPattern})/default$`, 'i'),
                        keys: ['userId', 'page']
                    },
                    
                    patternString: `^/users/(${router.defaultPathPattern})/(${router.defaultPathPattern})/default$`.toLocaleLowerCase()
                },
                {
                    path: '/users/:userId/:page/default/',
                    caseSensitive: true,
                    strict: true,
                    
                    expected: {
                        pattern: new RegExp(`^/users/(${router.defaultPathPattern})/(${router.defaultPathPattern})/default/$`),
                        keys: ['userId', 'page']
                    },
                    
                    patternString: `^/users/(${router.defaultPathPattern})/(${router.defaultPathPattern})/default/$`
                },
                {
                    path: '/users/:userId<\\d+>/:page/default',
                    caseSensitive: false,
                    strict: false,
                    
                    expected: {
                        pattern: new RegExp(`^/users/(\\d+)/(${router.defaultPathPattern})/default$`, 'i'),
                        keys: ['userId', 'page']
                    },
                    
                    patternString: `^/users/(\\d+)/(${router.defaultPathPattern})/default$`.toLowerCase()
                },   
                {
                    path: '/users/:userId<\\d+>/:page<\\w{8, 10}>/default',
                    caseSensitive: false,
                    strict: false,
                    
                    expected: {
                        pattern: new RegExp(`^/users/(\\d+)/(\\w{8, 10})/default$`, 'i'),
                        keys: ['userId', 'page']
                    },
                    
                    patternString: `^/users/(\\d+)/(\\w{8, 10})/default$`.toLocaleLowerCase()
                }, 
                {
                    path: '/users/:userId<\\d+>/view-:page<\\w{8, 10}>/default',
                    caseSensitive: false,
                    strict: false,
                    
                    expected: {
                        pattern: new RegExp(`^/users/(\\d+)/view-(\\w{8, 10})/default$`, 'i'),
                        keys: ['userId', 'page']
                    },
                    
                    patternString: `^/users/(\\d+)/view-(\\w{8, 10})/default$`.toLocaleLowerCase()
                }
            ];		

            let actual;
            
			for (let item of sample) {
                	
				actual = router.parseRoute(item.path, item.caseSensitive, item.strict);
         		
                expect(actual.pattern.source).toEqual(item.expected.pattern.source);
                expect(actual.pattern.flags).toEqual(item.expected.pattern.flags);
				expect(actual.keys).toDeepEqual(item.expected.keys);
			}
		});		
	});

	describe('findRoute', function() {
		it('must return undefined when routes not provided', function() {
			
            const config = {};
			const routesList = [ undefined, null, []];	
            const request = {};
            const pathname = null;
            	
			let actual;
			
			for (let routes of routesList) {
                	
				actual = router.findRoute({config, routes, request, pathname});
		
				expect(actual).toBeUndefined();
			}
		});	
		it('must return undefined when pathname not provided', function() {
			
            const config = {};
			const routes = [{}];	
            const requestsList = [ undefined, null, {}, null];
            	
			let actual;
			
			for (let request of requestsList) {
                	
				actual = router.findRoute({config, routes, request, pathname: undefined});
		
				expect(actual).toBeUndefined();
			}
		});	
		it('must return undefined when route not found', function() {
			
            const config = {
                route: {
                    strict: false
                }
            };
			const routes = [
                {
                    pattern: new RegExp(`^/users/(\\d+)/view-(\\w{7,9})$`, 'i'),
                    patternString: `^/users/(\\d+)/view-(\\w{7,9})$`,
                    keys: ['userId', 'page'],
                    httpMethods: [ 'get' ],
                },
                {
                    pattern: new RegExp(`^/users/(\\d+)/(\\w{7,9})$`, 'i'),
                    patternString: `^/users/(\\d+)/(\\w{7,9})$`,
                    keys: ['userId', 'page'],
                    httpMethods: [ 'get' ]
                },
                {
                    pattern: new RegExp(`^/users/(\\d+)/view-(\\w{7,9})$`, 'i'),
                    patternString: `^/users/(\\d+)/view-(\\w{7,9})$`,
                    keys: ['userId', 'page'],
                    httpMethods: [ 'post' ],
                },
                {
                    pattern: new RegExp(`^/usersList/(\\d+)/view-(\\w{7,9})$`),
                    patternString: `^/usersList/(\\d+)/view-(\\w{7,9})$`,
                    keys: ['userId', 'page'],
                    httpMethods: [ 'get' ]
                }
            ];	
            
            const request = {
                method: 'POST',
                url: 'http://www.allmy.sites.com/users/649/view-settingsSection',
                headers: { }
            };
            
            const pathname = '/users/649/view-settingsSection';
            	
            const actual = router.findRoute({config, routes, request, pathname});
    
            expect(actual).toBeUndefined();
		});		
		it('must match the correct route', function() {
			
            const config = {
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
            
            const pathname = '/users/649/view-settings';
            	
            const actual = router.findRoute({config, routes, request, pathname});
    
            expect(actual.route).toDeepEqual(routes[2]);
            
            const actualParamsKeys = Object.keys(actual.params);
            
            expect(actualParamsKeys).toDeepEqual(['userId', 'page']);
            expect(actual.params['userId']).toEqual('649');
            expect(actual.params['page']).toEqual('settings');
		});
		it('must return undefined when content type not allowed', function() {
			
            const config = {
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
            
            const pathname = '/users/649/view-settings';
            	
            const actual = router.findRoute({config, routes, request, pathname});
    
            expect(actual).toBeUndefined();
		});
		it('must match the correct route when content type is allowed', function() {
			
            const config = {
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
            
            const pathname = '/users/649/view-settings';
            
            const actual = router.findRoute({config, routes, request, pathname});
    
            expect(actual.route).toDeepEqual(routes[0]);
            
            const actualParamsKeys = Object.keys(actual.params);
            
            expect(actualParamsKeys).toDeepEqual(['userId', 'page']);
            expect(actual.params['userId']).toEqual('649');
            expect(actual.params['page']).toEqual('settings');
		});
		it('must return undefined when accept not allowed', function() {
			
            const config = {
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
            	
            const pathname = '/users/649/view-settings';
                
            const actual = router.findRoute({config, routes, request, pathname});
    
            expect(actual).toBeUndefined();
		});
		it('must match the correct route when accept is allowed', function() {
			
            const config = {
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
            	
            const pathname = '/users/649/view-settings';                
                
            const actual = router.findRoute({config, routes, request, pathname});

            expect(actual.route).toDeepEqual(routes[0]);
            
            const actualParamsKeys = Object.keys(actual.params);
            
            expect(actualParamsKeys).toDeepEqual(['userId', 'page']);
            expect(actual.params['userId']).toEqual('649');
            expect(actual.params['page']).toEqual('settings');
		});
    });	
});
