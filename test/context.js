'use strict';

import http from 'http';
import path from 'path';
import url from 'url';

import * as results from '../lib/actionResults';
import * as helpers from './support/helpers'

import Context from '../lib/context';

beforeEach(function(){
    jasmine.addMatchers(helpers.customMatchers);
});

describe('context', () => {
    
    describe('constructor', () => {
      
        it('should set config', () => {
            
            const config = { a: Math.random(), b: Math.random() };
            const request = { url: '/controller/action' };
            
            const ctx = new Context(config, null, [], request, {});
            
            expect(ctx.config).toEqual(config);
        });
        it('should set routes', () => {
            
            const routes = [ { a: Math.random() }, { b: Math.random() } ];
            const request = { url: 'controller/action' };
            
            const ctx = new Context({}, null, routes, request, {});
            
            expect(ctx.routes).toEqual(routes);
        });            
        it('should set request', () => {
            
            const request = { url: '/controller/action' };
            
            const ctx = new Context({}, null, [], request, {});
            
            expect(ctx.request).toEqual(request);
        });
        it('should set response', () => {
            
            const request = { url: '/controller/action' };
            const response = { a: Math.random(), b: Math.random() };
            
            const ctx = new Context({}, null, [], request, response);
            
            expect(ctx.response).toEqual(response);
        });                                     
    });  
    
    describe('get cookies()', () => {
        
        it('should not set cookies when cookieParser is not set', () => {
           
            const cookies = {
                a: Math.random().toString(),
                c: Math.random().toString(),
                b: Math.random().toString()
            }           

            const config = { cookieParser: undefined };
            
            const request = { 
                url: '/controller/action',
                method: 'get',
                headers: {
                    'cookie': `a=${cookies.a}; b=${cookies.b}; c=${cookies.c}`
                } 
            };
                    
            const ctx = new Context(config, null, [], request, {});

            expect(ctx.cookies).toEqual({});            
        });
        it('should set cookies when cookieParser is set', () => {
           
            const cookies = {
                a: Math.random().toString(),
                c: Math.random().toString(),
                b: Math.random().toString()
            }           

            const config = { cookieParser: {} };
            
            const request = { 
                url: '/controller/action',
                method: 'get',
                headers: {
                    'cookie': `a=${cookies.a}; b=${cookies.b}; c=${cookies.c}`
                } 
            };
                    
            const ctx = new Context(config, null, [], request, {});

            Object.keys(cookies).forEach(x => {
                expect(ctx.cookies.get(x)).toEqual(cookies[x]); 
            });           
        });        
    }); 
    
    describe('get headers()', () => {
        
        it('should return the request headers', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com',
                    ['x-forwarded-host']: 'www.proxied-host.com'
                }
            };
                    
            const ctx = new Context({}, null, [], request, {});

            expect(ctx.headers).toDeepEqual(request.headers);
        });
    });    
    
    describe('get host()', () => {
        
        it('should return the correct value when trusting proxy and x-forwarded-host', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com',
                    ['x-forwarded-host']: 'www.proxied-host.com'
                }, 
                connection: {
                    remoteAddress: '85.211.225.104'
                }
            };
            
            const config = {
                server: {
                    port: 3000
                }
            }
                    
            const ctx = new Context(config, () => true, [], request, {});

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
            
            const config = {
                server: {
                    port: 3000
                }
            }
                    
            const ctx = new Context(config, false, [], request, {});

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
            
            const config = {
                server: {
                    port: 3000
                }
            }
                    
            const ctx = new Context(config, 0, [], request, {});

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
            
            const config = {
                server: {
                    port: 3000
                }
            }
                    
            const ctx = new Context(config, undefined, [], request, {});

            expect(ctx.host).toEqual('www.site.com:3000');
        });
        it('should return the correct value when trusting proxy and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com',
                    ['x-forwarded-host']: 'www.proxied-host.com',
                    ['x-forwarded-port']: '80'
                }, 
                connection: {
                    remoteAddress: '85.211.225.104'
                }
            };
            
            const config = {
                server: {
                    port: 3000
                }
            }
                    
            const ctx = new Context(config, () => true, [], request, {});

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
            
            const config = {
                server: {
                    port: 3000
                }
            }
                    
            const ctx = new Context(config, false, [], request, {});

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
            
            const config = {
                server: {
                    port: 3000
                }
            }
                    
            const ctx = new Context(config, 0, [], request, {});

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
            
            const config = {
                server: {
                    port: 3000
                }
            }
                    
            const ctx = new Context(config, undefined, [], request, {});

            expect(ctx.host).toEqual('www.site.com:3000');
        });                                                                
        it('should return the correct value', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'www.site.com'
                }
            };
            
            const config = {
                server: {
                    port: 3000
                }
            }
                    
            const ctx = new Context(config, null, [], request, {});

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
                }, 
                connection: {
                    remoteAddress: '85.211.225.104'
                }
            };
               
            const ctx = new Context({}, () => true, [], request, {});

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

            const ctx = new Context({}, false, [], request, {});

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
              
            const ctx = new Context({}, 0, [], request, {});

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
     
            const ctx = new Context({}, undefined, [], request, {});

            expect(ctx.hostname).toEqual('www.site.com');
        });  
    });
    
    describe('get ip()', () => {
        
        it('should return the correct value when trusting proxy and x-forwarded-for', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-for']: '85.211.225.101,85.211.225.102,85.211.225.103'
                },
                connection: {
                    remoteAddress: '85.211.225.104'
                }
            };
            
            const ctx = new Context({}, () => true, [], request, {});

            expect(ctx.ip).toEqual('85.211.225.101');
        });
        it('should return the correct value when not trusting proxy (false) and x-forwarded-for', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-for']: '85.211.225.101,85.211.225.102,85.211.225.103'
                },
                connection: {
                    remoteAddress: '85.211.225.104'
                }
            };
               
            const ctx = new Context({}, false, [], request, {});

            expect(ctx.ip).toEqual(request.connection.remoteAddress);
        });
        it('should return the correct value when not trusting proxy (falsy) and x-forwarded-for', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-for']: '85.211.225.101,85.211.225.102,85.211.225.103'
                },
                connection: {
                    remoteAddress: '85.211.225.104'
                }
            };
                    
            const ctx = new Context({}, 0, [], request, {});

            expect(ctx.ip).toEqual(request.connection.remoteAddress);
        });  
        it('should return the correct value when not trusting proxy (undefined) and x-forwarded-for', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-for']: '85.211.225.101,85.211.225.102,85.211.225.103'
                },
                connection: {
                    remoteAddress: '85.211.225.104'
                }
            };
     
            const ctx = new Context({}, undefined, [], request, {});

            expect(ctx.ip).toEqual(request.connection.remoteAddress);
        });                      
    });    
    
    describe('get ips()', () => {
        
        it('should return the correct value when trusting proxy and x-forwarded-for', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-for']: '85.211.225.101,85.211.225.102,85.211.225.103'
                },
                connection: {
                    remoteAddress: '85.211.225.104'
                }
            };
                    
            const ctx = new Context({}, () => true, [], request, {});

            expect(ctx.ips).toEqual(['85.211.225.101','85.211.225.102','85.211.225.103','85.211.225.104']);
        });
        it('should return the correct value when not trusting proxy (false) and x-forwarded-for', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-for']: '85.211.225.101,85.211.225.102,85.211.225.103'
                },
                connection: {
                    remoteAddress: '85.211.225.104'
                }
            };
             
            const ctx = new Context({}, false, [], request, {});

            expect(ctx.ips).toEqual([request.connection.remoteAddress]);
        });
        it('should return the correct value when not trusting proxy (falsy) and x-forwarded-for', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-for']: '85.211.225.101,85.211.225.102,85.211.225.103'
                },
                connection: {
                    remoteAddress: '85.211.225.104'
                }
            };
            
            const ctx = new Context({}, 0, [], request, {});

            expect(ctx.ips).toEqual([request.connection.remoteAddress]);
        });  
        it('should return the correct value when not trusting proxy (undefined) and x-forwarded-for', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-for']: '85.211.225.101,85.211.225.102,85.211.225.103'
                },
                connection: {
                    remoteAddress: '85.211.225.104'
                }
            };
   
            const ctx = new Context({}, undefined, [], request, {});

            expect(ctx.ips).toEqual([request.connection.remoteAddress]);
        });                      
    });    
    
    describe('get port()', () => {
        
        it('should return the correct value when trusting proxy and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-port']: '80'
                }, 
                connection: {
                    remoteAddress: '85.211.225.104'
                }
            };
            
            const config = {
                server: {
                    port: 3000
                }                
            }
                    
            const ctx = new Context(config, () => true, [], request, {});

            expect(ctx.port).toEqual(80);
        });
        it('should return the correct value when trusting proxy (false) and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-port']: '80'
                }
            };
            
            const config = {
                server: {
                    port: 3000
                }                
            }
                    
            const ctx = new Context(config, false, [], request, {});

            expect(ctx.port).toEqual(config.server.port);
        });
        it('should return the correct value when trusting proxy (falsy) and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-port']: '80'
                }
            };
            
            const config = {
                server: {
                    port: 3000
                }                
            }
                    
            const ctx = new Context(config, 0, [], request, {});

            expect(ctx.port).toEqual(config.server.port);
        });
        it('should return the correct value when trusting proxy (undefined) and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-port']: '80'
                }
            };
            
            const config = {
                server: {
                    port: 3000
                }                
            }
                    
            const ctx = new Context(config, undefined, [], request, {});

            expect(ctx.port).toEqual(config.server.port);
        });                    
    });
    
    describe('get protocol()', () => {
        
        it('should return the correct value (https) when trusting proxy and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-proto']: 'https'
                }, 
                connection: {
                    remoteAddress: '85.211.225.104'
                }
            };
              
            const ctx = new Context({}, () => true, [], request, {});

            expect(ctx.protocol).toEqual('https');
        });
        it('should return the correct value (http) when trusting proxy and x-forwarded-port', () => {
                   
            const request = { 
                url: '/controller/action',
                headers : {
                    ['x-forwarded-proto']: 'http'
                }, 
                connection: {
                    remoteAddress: '85.211.225.104'
                }
            };
                    
            const ctx = new Context({}, () => true, [], request, {});

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
                    
            const ctx = new Context({}, false, [], request, {});

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
                  
            const ctx = new Context({}, false, [], request, {});

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
                    
            const ctx = new Context({}, false, [], request, {});

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
                    
            const ctx = new Context({}, false, [], request, {});

            expect(ctx.protocol).toEqual('http');
        });                          
    });
    
    describe('get statusCode', () => {
        
        it('should return the response status code', () => {
                   
            const request = { 
                url: '/controller/action',
            };

            const response = { statusCode: Math.random() };
      
            const ctx = new Context({}, null, [], request, response);

            expect(ctx.statusCode).toEqual(response.statusCode);
        });
    });     
    
    describe('get subdomains()', () => {
        
        it('should return an empty array when accessing by ipv4', () => {
            
            const request = { 
                url: '/controller/action',
                headers : {
                    host: '192.169.10.04'
                }
            };
    
            const ctx = new Context({}, null, [], request, {});

            expect(ctx.subdomains).toEqual([]);                    
        });
        it('should return an empty array when accessing by ipv6', () => {
            
            const request = { 
                url: '/controller/action',
                headers : { }
            };
            
            const hosts = [
                '1050:0000:0000:0000:0005:0600:300c:326b',
                '1050:0:0:0:5:600:300c:326b',
                '0:0:0:0:0:ffff:192.1.56.10'
            ];
    
            let ctx;
            
            for (let host of hosts) {
                
                request.headers.host = host;
                
                ctx = new Context({}, null, [], request, {});

                expect(ctx.subdomains).toEqual([]);                
            }                    
        });
        it('should return an empty array when accessing by ipv4', () => {
            
            const request = { 
                url: '/controller/action',
                headers : {
                    host: 'sub1.sub2.sub3.example.com'
                }
            };
            
            const config = { };
            
            const sample = [
                {
                    subdomainOffset: 0,
                    expected: ['com', 'example', 'sub3', 'sub2', 'sub1']
                },                
                {
                    subdomainOffset: 1,
                    expected: ['example', 'sub3', 'sub2', 'sub1']
                },
                {
                    subdomainOffset: 2,
                    expected: ['sub3', 'sub2', 'sub1']
                },
                {
                    subdomainOffset: 3,
                    expected: ['sub2', 'sub1']
                },
                {
                    subdomainOffset: 4,
                    expected: ['sub1']
                },
                {
                    subdomainOffset: 5,
                    expected: []
                }                                                  
            ];
    
            for (let item of sample) {
             
                config.subdomainOffset = item.subdomainOffset;
                
                const ctx = new Context(config, null, [], request, {});

                expect(ctx.subdomains).toEqual(item.expected);                   
            }                 
        });              
    });        
         
    describe('set statusCode', () => {
        
        it('should set the response statusCode', () => {
                   
            const request = { 
                url: '/controller/action',
            };

            const response = {};
      
            const ctx = new Context({}, null, [], request, response);
            
            const statusCode = 404;
            
            ctx.statusCode = statusCode;

            expect(response.statusCode).toEqual(statusCode);
        });
    });
    
    describe('set statusMessage', () => {
        
        it('should set the response statusMessage', () => {
                   
            const request = { 
                url: '/controller/action',
            };

            const response = {};
      
            const ctx = new Context({}, null, [], request, response);
            
            const statusMessage = Math.random().toString();
            
            ctx.statusMessage = statusMessage;

            expect(response.statusMessage).toEqual(statusMessage);
        });
    }); 
    
    describe('download', () => {
        
        it('should set the result and resolve', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const config = {
                applicationRoot: '/appRoot'
            };

            const ctx = new Context(config, null, [], request, {});

            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');
            
            const filePath = Math.random().toString();
            const filename = Math.random().toString();
            const contentType = Math.random().toString();
            const options = { a: Math.random(), b: Math.random() };
            
            ctx.download(filePath, filename, contentType, options);
            
            expect(ctx.result instanceof results.DownloadResult).toBeTruthy();
            expect(ctx.resolve).toHaveBeenCalled();
        });
    }); 
    
    describe('next', () => {
        
        it('should set the result to null and resolve', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});

            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');
            
            ctx.next();
            
            expect(ctx.result).toBeNull();
            expect(ctx.resolve).toHaveBeenCalled();
        });
    });  
    
    describe('redirect', () => {
        
        it('should set the result and resolve', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});

            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');
            
            const redirectUrl = '/redirect/url';
            const statusCode = Math.random();
            
            ctx.redirect(redirectUrl, statusCode);
            
            expect(ctx.statusCode).toBe(statusCode);
            expect(ctx.result instanceof results.RedirectResult).toBeTruthy();
            expect(ctx.resolve).toHaveBeenCalled();
        });
        
        it('should set the result and and default status code and resolve', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});

            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');
            
            const redirectUrl = '/redirect/url';
            const statusCode = Math.random();
            
            ctx.redirect(redirectUrl);
            
            expect(ctx.statusCode).toBe(303);
            expect(ctx.result instanceof results.RedirectResult).toBeTruthy();
            expect(ctx.resolve).toHaveBeenCalled();
        });        
    }); 

    describe('redirectToRoute', () => {
        
        it('should set the result and resolve', () => {
                  
            const routeName = 'testRoute';              
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});
            
            const url = Math.random().toString();
            
            spyOn(ctx, 'routeURL').and.returnValue(url);
            spyOn(ctx, 'redirect');
            
            const params = { a: Math.random(), b: Math.random() };
            const query = { c: Math.random(), d: Math.random() }
            const validate = (Math.random() > 0.5);
            const statusCode = (Math.random() * 100).toFixed() + 1;       

            ctx.redirectToRoute(routeName, params, query, validate, statusCode);
            
            expect(ctx.routeURL).toHaveBeenCalledWith(routeName, params, query, validate);
            expect(ctx.redirect).toHaveBeenCalledWith(url, statusCode);
        });
    }); 
    
    describe('removeHeader', () => {
        
        it('should remove the response header and return the context', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const response = {
                removeHeader: () => {}
            }
            
            const ctx = new Context({}, null, [], request, response);
            
            spyOn(ctx.response, 'removeHeader');
            
            const headerName = 'X-Useless-Header';
            
            const result = ctx.removeHeader(headerName);
            
            expect(result).toEqual(ctx);
            expect(ctx.response.removeHeader).toHaveBeenCalledWith(headerName);
        });
    }); 
    
    describe('send', () => {
        
        it('should set the result and resolve', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});

            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');
            
            const body = 'Hello';
            const contentType = 'text/html';
            
            ctx.send(body, contentType);
            
            expect(ctx.result instanceof results.ContentResult).toBeTruthy();
            expect(ctx.resolve).toHaveBeenCalled();
        });
    });     
    
    describe('sendJSON', () => {
        
        it('should set the result and resolve', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});

            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');
            
            const body = 'Hello';
            
            ctx.sendJSON(body);
            
            expect(ctx.result instanceof results.JSONResult).toBeTruthy();
            expect(ctx.resolve).toHaveBeenCalled();
        });
    });  
    
    describe('sendJSONP', () => {
        
        it('should set the result and resolve', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});

            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');
            
            const data = { a: Math.random() };
            
            ctx.sendJSONP(data)
            
            expect(ctx.result instanceof results.JSONPResult).toBeTruthy();
            expect(ctx.resolve).toHaveBeenCalled();
        });
    }); 
    
    describe('sendFile', () => {
        
        it('should set the result and resolve', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});

            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');
            
            const filePath = 'dir1/dir2//file';
            const contentType = 'text/plain';
            const options = { root: process.cwd() };
            
            ctx.sendFile(filePath, contentType, options);
            
            expect(ctx.result instanceof results.FileResult).toBeTruthy();
            expect(ctx.resolve).toHaveBeenCalled();
        });
    }); 
       
    describe('sendStatus', () => {
        
        it('should set the status code and call send', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});

            ctx.resolve = () => {};
            
            spyOn(ctx, 'send');
            
            const code = Math.random().toFixed();
            const message = Math.random().toString();
            
            ctx.sendStatus(code, message);
            
            expect(ctx.response.statusCode).toBe(code);
            expect(ctx.send).toHaveBeenCalledWith(message);
        });
        
        it('should set the status code and call send with default message', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});

            ctx.resolve = () => {};
            
            spyOn(ctx, 'send');
            
            const code = 503;
            
            ctx.sendStatus(code);
            
            expect(ctx.response.statusCode).toBe(code);
            expect(ctx.send).toHaveBeenCalledWith(http.STATUS_CODES[code]);
        });        
    }); 
    
    describe('setHeader', () => {
        
        it('should set the header', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const response = {
                setHeader(headerName, headerValue) {}
            }
            
            spyOn(response, 'setHeader');
            
            const ctx = new Context({}, null, [], request, response);
            
            const headerName = Math.random().toString();
            const headerValue = Math.random().toString();
            
            const result = ctx.setHeader(headerName, headerValue);
            
            expect(result).toBe(ctx);
            expect(ctx.response.setHeader).toHaveBeenCalledWith(headerName, headerValue);
        });
    });
    
    describe('setHeaders', () => {
        
        it('should set the headers (Object)', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const response = {
                setHeader(headerName, headerValue) {}
            }
            
            spyOn(response, 'setHeader');
            
            const ctx = new Context({}, null, [], request, response);
            
            const headersArray = [
                [Math.random().toString(), Math.random().toString()],
                [Math.random().toString(), Math.random().toString()],
                [Math.random().toString(), Math.random().toString()],
                [Math.random().toString(), Math.random().toString()],   
            ];
            
            const headers = {};

            for (let [name, value] of headersArray) {
                headers[name] = value;
            }
                     
            const result = ctx.setHeaders(headers);
            
            expect(result).toBe(ctx);
            expect(ctx.response.setHeader.calls.count()).toBe(headersArray.length);
            
            for (let i = 0; i < headersArray.length; i++) {
                expect(ctx.response.setHeader.calls.argsFor(i)).toEqual(headersArray[i]);
            }
        });
        it('should set the headers (Map)', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const response = {
                setHeader(headerName, headerValue) {}
            }
            
            spyOn(response, 'setHeader');
            
            const ctx = new Context({}, null, [], request, response);
            
            const headersArray = [
                [Math.random().toString(), Math.random().toString()],
                [Math.random().toString(), Math.random().toString()],
                [Math.random().toString(), Math.random().toString()],
                [Math.random().toString(), Math.random().toString()],   
            ];
                        
            const headers = new Map(headersArray);
                   
            const result = ctx.setHeaders(headers);
            
            expect(result).toBe(ctx);
            expect(ctx.response.setHeader.calls.count()).toBe(headers.size);
            
            let idx = 0;
            
            for (let entry of headers) {
                expect(ctx.response.setHeader.calls.argsFor(idx++)).toEqual(entry);
            }
        });
    }); 
    
    describe('skipToAction', () => {
        
        it('should set the result and resolve', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});

            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');
            
            ctx.skipToAction();
            
            expect(ctx.result instanceof results.SkipToActionResult).toBeTruthy();
            expect(ctx.resolve).toHaveBeenCalled();
        });
    }); 
    
    describe('stream', () => {
        
        it('should set the result and resolve', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});

            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');
            
            const stream = {};
            const contentType = 'text/plain';
            
            ctx.stream(stream, contentType);
            
            expect(ctx.result instanceof results.StreamResult).toBeTruthy();
            expect(ctx.resolve).toHaveBeenCalled();
        });
    });   
    
    describe('throw', () => {
        
        it('should set the result to null and reject', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const error = new Error();

            const ctx = new Context({}, null, [], request, {});

            ctx.reject = (err) => {};
            
            spyOn(ctx, 'reject');
            
            ctx.throw(error);
            
            expect(ctx.result).toBeNull();
            expect(ctx.reject).toHaveBeenCalledWith(error);
        });
    });
    
    describe('routeURL', () => {

        it('should return route has no params', () => {
                  
            const routeName = 'testRoute';

            const request = { 
                url: '/controller/action',
            };
            
            const routes = [{
                actionRoute: {
                    name: routeName
                },
                keys: ['a', 'b'],
                routePath: Math.random().toString()
            }];
            
            const ctx = new Context({}, null, routes, request, {});

            const url = ctx.routeURL(routeName, undefined, {}, true);
            
            expect(url).toBe(routes[0].routePath);
        });
        it('should throw on invalid param', () => {
                  
            const routeName = 'testRoute';

            const request = { 
                url: '/controller/action',
            };
            
            const routes = [{
                actionRoute: {
                    name: routeName
                },
                keys: ['category', 'section'],
                routePath: '/products/:category<^[^\\d]+$>/:section'
            }];
            
            const ctx = new Context({}, null, routes, request, {});

            const params = {
                category: Math.random().toString(),
                section: Math.random().toString()
            }
            
            const query = {
                a: Math.random().toString(),
                b: Math.random().toString()
            }

            expect(() => ctx.routeURL(routeName, params, query, true)).toThrowError(`Invalid route param value: ${params.category}`);
        });            
        it('should return routePath when route has no keys', () => {
                  
            const routeName = 'testRoute';

            const request = { 
                url: '/controller/action',
            };
            
            const routes = [{
                actionRoute: {
                    name: routeName
                },
                keys: ['category', 'section'],
                routePath: '/products/:category/:section'
            }];
            
            const ctx = new Context({}, null, routes, request, {});

            const params = {
                category: Math.random().toString(),
                section: Math.random().toString()
            }
            
            const query = {
                a: Math.random().toString(),
                b: Math.random().toString()
            }

            const url = ctx.routeURL(routeName, params, query, true);
            
            expect(url).toBe(`/products/${params.category}/${params.section}?a=${query.a}&b=${query.b}`);
        });
        it('should return the correct url', () => {
                  
            const routeName = 'testRoute';

            const request = { 
                url: '/controller/action',
            };
            
            const routes = [{
                actionRoute: {
                    name: routeName
                },
                routePath: Math.random().toString()
            }];
            
            const ctx = new Context({}, null, routes, request, {});

            const url = ctx.routeURL(routeName, {}, undefined, true);
            
            expect(url).toBe(routes[0].routePath);
        });        
    });  
    
    describe('render', () => {
        
        it('should throw when viewPath not specified and arguments length is greater than two', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const locals = {};
            const contentType = 'text/plain';
            const someArg = '';

            const ctx = new Context({}, null, [], request, {});

            expect(() => ctx.render(locals, contentType, someArg)).toThrowError('Wrong Arguments: render([viewPath], [locals], [contentType])');
        });
        it('should throw when contentType is not a string', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const locals = {};
            const contentType = {};

            const ctx = new Context({}, null, [], request, {});

            expect(() => ctx.render(locals, contentType)).toThrowError('Argument error: [contentType]');
        }); 
        it('should set the result and resolve when called with no arguments', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});
            
            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');

            ctx.render();
            
            expect(ctx.result instanceof results.ViewResult).toBe(true);
            expect(ctx.resolve).toHaveBeenCalled();
        });
        it('should set the result and resolve when called with viewPath', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});
            
            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');

            const viewPath = Math.random().toString();

            ctx.render(viewPath);
            
            expect(ctx.result instanceof results.ViewResult).toBe(true);
            expect(ctx.resolve).toHaveBeenCalled();
        });    
        it('should set the result and resolve when called with viewPath and locals', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});
            
            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');

            const viewPath = Math.random().toString();
            const locals = { a: Math.random() };
            
            ctx.render(viewPath, locals);
            
            expect(ctx.result instanceof results.ViewResult).toBe(true);
            expect(ctx.resolve).toHaveBeenCalled();
        });
        it('should set the result and resolve when called with viewPath and contentType', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});
            
            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');

            const viewPath = Math.random().toString();
            const contentType = 'text/html';
            
            ctx.render(viewPath, contentType);
            
            expect(ctx.result instanceof results.ViewResult).toBe(true);
            expect(ctx.resolve).toHaveBeenCalled();
        });          
        it('should set the result and resolve when called with locals', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});
            
            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');

            const locals = { a: Math.random() };
            
            ctx.render(locals);
            
            expect(ctx.result instanceof results.ViewResult).toBe(true);
            expect(ctx.resolve).toHaveBeenCalled();
        });
        it('should set the result and resolve when called with locals and contentType', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});
            
            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');

            const locals = { a: Math.random() };
            const contentType = 'text/html';
            
            ctx.render(locals, contentType);
            
            expect(ctx.result instanceof results.ViewResult).toBe(true);
            expect(ctx.resolve).toHaveBeenCalled();
        });
        it('should set the result and resolve when called with viewPath, locals and contentType', () => {
                   
            const request = { 
                url: '/controller/action',
            };
            
            const ctx = new Context({}, null, [], request, {});
            
            ctx.resolve = () => {};
            
            spyOn(ctx, 'resolve');

            const viewPath = Math.random().toString();
            const locals = { a: Math.random() };
            const contentType = 'text/html';
            
            ctx.render(viewPath, locals, contentType);
            
            expect(ctx.result instanceof results.ViewResult).toBe(true);
            expect(ctx.resolve).toHaveBeenCalled();
        });                                                     
    });
                                                                                                 
});