'use strict';

import path from 'path';
import url from 'url';

import * as helpers from './support/helpers'

import Context from '../lib/context';

beforeEach(function(){
    jasmine.addMatchers(helpers.customMatchers);
});

describe('context', () => {
    
    describe('constructor', () => {
      
        it('should set appSettings', () => {
            
            const appSettings = { a: Math.random(), b: Math.random() };
            const request = { url: '/controller/action' };
            
            const ctx = new Context(appSettings, [], request, {});
            
            expect(ctx.appSettings).toEqual(appSettings);
        });
        it('should set routes', () => {
            
            const routes = [ { a: Math.random() }, { b: Math.random() } ];
            const request = { url: 'controller/action' };
            
            const ctx = new Context({}, routes, request, {});
            
            expect(ctx.routes).toEqual(routes);
        });            
        it('should set request', () => {
            
            const request = { url: '/controller/action' };
            
            const ctx = new Context({}, [], request, {});
            
            expect(ctx.request).toEqual(request);
        });
        it('should set response', () => {
            
            const request = { url: '/controller/action' };
            const response = { a: Math.random(), b: Math.random() };
            
            const ctx = new Context({}, [], request, response);
            
            expect(ctx.response).toEqual(response);
        }); 
        it('should set state', () => {
            
            const request = { url: '/controller/action' };
            
            const ctx = new Context({}, [], request, {});
            
            expect(ctx.state).toEqual({});
        });
        it('should set pathname', () => {
            
            const request = { url: '/controller/action?dd=gjhkh&df=sgrsjg' };
                    
            const ctx = new Context({}, [], request, {});

            expect(ctx.pathname).toEqual('/controller/action');
        });
        it('should set query', () => {
            
            let query = {
                a: Math.random(),
                b: Math.random(),
                c: Math.random()
            };
            
            const request = { url: `/controller/action?a=${query.a}&b=${query.b}&c=${query.c}` };
            const pathname = path.normalize(decodeURI(url.parse(request.url).pathname));
                    
            const ctx = new Context({}, [], request, {});

            expect(ctx.query).toDeepEqual(query);
        });  
        it('should set search', () => {
                 
            const request = { url: '/controller/action?a=$kgyhf&b=lhjgh&c=kyjj' };
                    
            const ctx = new Context({}, [], request, {});

            expect(ctx.search).toEqual('?a=$kgyhf&b=lhjgh&c=kyjj');
        });      
        it('should set href', () => {
                   
            const request = { url: '/controller/action?a=kjgg&b=$sff&c=hjfhf' };
                    
            const ctx = new Context({}, [], request, {});

            expect(ctx.href).toEqual(request.url);
        }); 
        it('should set path', () => {
                   
            const request = { url: '/controller/action?a=kjgg&b=$sff&c=hjfhf' };
                    
            const ctx = new Context({}, [], request, {});

            expect(ctx.path).toEqual('/controller/action?a=kjgg&b=$sff&c=hjfhf');
        });                                     
    });  
    
    describe('get cookies()', () => {
        
        it('should not set cookies when cookieParser is not set', () => {
           
            const cookies = {
                a: Math.random().toString(),
                c: Math.random().toString(),
                b: Math.random().toString()
            }           

            const appSettings = { cookieParser: undefined };
            
            const request = { 
                url: '/controller/action',
                method: 'get',
                headers: {
                    'cookie': `a=${cookies.a}; b=${cookies.b}; c=${cookies.c}`
                } 
            };
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.cookies).toEqual({});            
        });
        it('should set cookies when cookieParser is set', () => {
           
            const cookies = {
                a: Math.random().toString(),
                c: Math.random().toString(),
                b: Math.random().toString()
            }           

            const appSettings = { cookieParser: {} };
            
            const request = { 
                url: '/controller/action',
                method: 'get',
                headers: {
                    'cookie': `a=${cookies.a}; b=${cookies.b}; c=${cookies.c}`
                } 
            };
                    
            const ctx = new Context(appSettings, [], request, {});

            Object.keys(cookies).forEach(x => {
                expect(ctx.cookies.get(x)).toEqual(cookies[x]); 
            });           
        });        
    }); 
    
    describe('get host()', () => {
        
        it('should return the correct value when trusting proxy and x-forwarded-host', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com',
                    ['x-forwarded-host']: 'www.proxied-host.com'
                }
            };
            
            const appSettings = {
                server: {
                    port: 3000
                },
                trustProxy: true
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.host).toEqual('www.proxied-host.com:3000');
        });
        it('should return the correct value when not trusting proxy (false) and x-forwarded-host', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com',
                    ['x-forwarded-host']: 'www.proxied-host.com'
                }
            };
            
            const appSettings = {
                server: {
                    port: 3000
                },
                trustProxy: false
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.host).toEqual('www.site.com:3000');
        }); 
        it('should return the correct value when not trusting proxy (falsy) and x-forwarded-host', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com',
                    ['x-forwarded-host']: 'www.proxied-host.com'
                }
            };
            
            const appSettings = {
                server: {
                    port: 3000
                },
                trustProxy: ''
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.host).toEqual('www.site.com:3000');
        }); 
        it('should return the correct value when not trusting proxy (undefined) and x-forwarded-host', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com',
                    ['x-forwarded-host']: 'www.proxied-host.com'
                }
            };
            
            const appSettings = {
                server: {
                    port: 3000
                },
                trustProxy: undefined
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.host).toEqual('www.site.com:3000');
        });
        it('should return the correct value when trusting proxy and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com',
                    ['x-forwarded-host']: 'www.proxied-host.com',
                    ['x-forwarded-port']: '80'
                }
            };
            
            const appSettings = {
                server: {
                    port: 3000
                },
                trustProxy: true
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.host).toEqual('www.proxied-host.com:80');
        }); 
        it('should return the correct value when not trusting proxy (false) and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com',
                    ['x-forwarded-host']: 'www.proxied-host.com',
                    ['x-forwarded-port']: '80'
                }
            };
            
            const appSettings = {
                server: {
                    port: 3000
                },
                trustProxy: false
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.host).toEqual('www.site.com:3000');
        });
        it('should return the correct value when not trusting proxy (falsy) and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com',
                    ['x-forwarded-host']: 'www.proxied-host.com',
                    ['x-forwarded-port']: '80'
                }
            };
            
            const appSettings = {
                server: {
                    port: 3000
                },
                trustProxy: ''
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.host).toEqual('www.site.com:3000');
        }); 
        it('should return the correct value when not trusting proxy (undefined) and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com',
                    ['x-forwarded-host']: 'www.proxied-host.com',
                    ['x-forwarded-port']: '80'
                }
            };
            
            const appSettings = {
                server: {
                    port: 3000
                },
                trustProxy: undefined
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.host).toEqual('www.site.com:3000');
        });                                                                
        it('should return the correct value', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com'
                }
            };
            
            const appSettings = {
                server: {
                    port: 3000
                }
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.host).toEqual('www.site.com:3000');
        });  
    });
    
    
    describe('get hostname()', () => {
        
        it('should return the correct value when trusting proxy and x-forwarded-host', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com',
                    ['x-forwarded-host']: 'www.proxied-host.com'
                }
            };
            
            const appSettings = {
                trustProxy: true
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.hostname).toEqual('www.proxied-host.com');
        });
        it('should return the correct value when not trusting proxy (false) and x-forwarded-host', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com',
                    ['x-forwarded-host']: 'www.proxied-host.com'
                }
            };
            
            const appSettings = {
                trustProxy: false
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.hostname).toEqual('www.site.com');
        }); 
        it('should return the correct value when not trusting proxy (falsy) and x-forwarded-host', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com',
                    ['x-forwarded-host']: 'www.proxied-host.com'
                }
            };
            
            const appSettings = {
                trustProxy: ''
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.hostname).toEqual('www.site.com');
        }); 
        it('should return the correct value when not trusting proxy (undefined) and x-forwarded-host', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com',
                    ['x-forwarded-host']: 'www.proxied-host.com'
                }
            };
            
            const appSettings = {
                trustProxy: undefined
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.hostname).toEqual('www.site.com');
        });  
    });
    
    describe('get ips()', () => {
        
        it('should return the correct value when trusting proxy and x-forwarded-for', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-for']: '1.2.3.4,5.6.7.8,9.1.2.3,4.5.6.7'
                }
            };
            
            const appSettings = {
                trustProxy: true
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.ips).toEqual(['1.2.3.4','5.6.7.8','9.1.2.3','4.5.6.7']);
        });
        it('should return the correct value when not trusting proxy (false) and x-forwarded-for', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-for']: '1.2.3.4,5.6.7.8,9.1.2.3,4.5.6.7'
                },
                connection: {
                    remoteAddress: '1.2.3.4'
                }
            };
            
            const appSettings = {
                trustProxy: false
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.ips).toEqual([request.connection.remoteAddress]);
        });
        it('should return the correct value when not trusting proxy (falsy) and x-forwarded-for', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-for']: '1.2.3.4,5.6.7.8,9.1.2.3,4.5.6.7'
                },
                connection: {
                    remoteAddress: '1.2.3.4'
                }
            };
            
            const appSettings = {
                trustProxy: ''
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.ips).toEqual([request.connection.remoteAddress]);
        });  
        it('should return the correct value when not trusting proxy (undefined) and x-forwarded-for', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-for']: '1.2.3.4,5.6.7.8,9.1.2.3,4.5.6.7'
                },
                connection: {
                    remoteAddress: '1.2.3.4'
                }
            };
            
            const appSettings = {
                trustProxy: undefined
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.ips).toEqual([request.connection.remoteAddress]);
        });                      
    });    
    
    describe('get port()', () => {
        
        it('should return the correct value when trusting proxy and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-port']: '80'
                }
            };
            
            const appSettings = {
                trustProxy: true,
                server: {
                    port: 3000
                }                
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.port).toEqual(80);
        });
        it('should return the correct value when trusting proxy (false) and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-port']: '80'
                }
            };
            
            const appSettings = {
                trustProxy: false,
                server: {
                    port: 3000
                }                
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.port).toEqual(appSettings.server.port);
        });
        it('should return the correct value when trusting proxy (falsy) and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-port']: '80'
                }
            };
            
            const appSettings = {
                trustProxy: '',
                server: {
                    port: 3000
                }                
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.port).toEqual(appSettings.server.port);
        });
        it('should return the correct value when trusting proxy (undefined) and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-port']: '80'
                }
            };
            
            const appSettings = {
                trustProxy: undefined,
                server: {
                    port: 3000
                }                
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.port).toEqual(appSettings.server.port);
        });                    
    });
    
    describe('get protocol()', () => {
        
        it('should return the correct value (https) when trusting proxy and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-proto']: 'https'
                }
            };
            
            const appSettings = {
                trustProxy: true               
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.protocol).toEqual('https');
        });
        it('should return the correct value (http) when trusting proxy and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-proto']: 'http'
                }
            };
            
            const appSettings = {
                trustProxy: true               
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.protocol).toEqual('http');
        });
        it('should return the correct value when connection encrypted and not trusting (false) proxy and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-proto']: 'https'
                },
                connection: {
                    encrypted: true
                }
            };
            
            const appSettings = {
                trustProxy: false               
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.protocol).toEqual('https');
        }); 
        it('should return the correct value when connection not encrypted and not trusting (false) proxy and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-proto']: 'https'
                },
                connection: {
                    encrypted: false
                }
            };
            
            const appSettings = {
                trustProxy: false               
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.protocol).toEqual('http');
        });
        it('should return the correct value when connection encrypted and not trusting (false) proxy', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : { },
                connection: {
                    encrypted: true
                }
            };
            
            const appSettings = {
                trustProxy: false               
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.protocol).toEqual('https');
        }); 
        it('should return the correct value when connection not encrypted and not trusting (false) proxy', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : { },
                connection: {
                    encrypted: false
                }
            };
            
            const appSettings = {
                trustProxy: false               
            }
                    
            const ctx = new Context(appSettings, [], request, {});

            expect(ctx.protocol).toEqual('http');
        });                          
    });
    
    // describe('get subdomains()', () => {
        
        
    // });        
                                           
});