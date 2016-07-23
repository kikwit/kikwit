'use strict';

import http from 'http';
import path from 'path';
import querystring from 'querystring';
import url from 'url';

import Cookies from 'cookies';
import proxyAddr from 'proxy-addr';

import * as results from './actionResults';

const _cookies = Symbol();
const _host = Symbol();
const _hostname = Symbol();
const _ips = Symbol();
const _port = Symbol();
const _protocol = Symbol();
const _subdomains = Symbol();

export default class {

    constructor(config, trustProxy, routes, request, response) {

        this.config = config;
        this.trustProxy = trustProxy;
        this.request = request;
        this.response = response;
        this.routes = routes;
        
        this.state = {};
        
        const parsedUrl = url.parse(this.request.url, true);

        this.pathname = path.normalize(decodeURI(parsedUrl.pathname));
        this.query = parsedUrl.query;
        this.search = parsedUrl.search;
        this.href = parsedUrl.href;
                
        this.path = this.pathname + this.search;  
        
        this.locals = {};
    }
    
    get cookies() {
        
        if (this[_cookies] === undefined) {
            
            let cookies = {};
            
            if (this.config.cookieParser) {

                cookies = new Cookies(this.request, this.response, {
                    keys: this.config.cookieParser.keys
                });
            }
           
            this[_cookies] = cookies;       
        }
        
        return this[_cookies];
    }
    
    get headers() {
        
        return this.request.headers;
    }
         
    get host() {

        if (this[_host] === undefined) {
            
            this[_host] = `${this.hostname}:${this.port}`;
        }
        
        return this[_host];
    }

    get hostname() {

        if (this[_hostname] === undefined) {
        
            let hostname;

            if (this.trustProxy 
                && this.trustProxy(this.request.connection.remoteAddress, 0)) {

                hostname = this.request.headers['x-forwarded-host'];
            }

            if (!hostname || !hostname.trim()) {
                hostname = this.request.headers['host'];
            }

            const portPattern = /:\d{1,5}$/;

            if (portPattern.test(hostname)) {
                hostname = hostname.replace(portPattern, '');
            }
            
            this[_hostname] = hostname;
        }

        return this[_hostname];
    }
    
    get ip() {

        return this.ips[0];
    }    
    
    get ips() {

        if (this[_ips] === undefined) {

            let ips;

            if (this.trustProxy) {

                ips = proxyAddr.all(this.request, this.trustProxy) || [];

                ips && ips.reverse();
            } 
            
            if (!ips || !ips.length) {
                ips = [this.request.connection.remoteAddress];
            }

            this[_ips] = ips;
        }

        return this[_ips];
    }

    get logger() {
        
        return  this.config.logger;
    }
    
    get port() {

        if (this[_port] === undefined) {
            
            let port;

            if (this.trustProxy 
                && this.trustProxy(this.request.connection.remoteAddress, 0)) {
                    
                port = this.request.headers['x-forwarded-port'];
            }

            if (!port || !port.trim()) {
                port = this.config.server.port;
            }

            this[_port] = Number(port);
        }
        
        return this[_port];
    }

    get protocol() {

        if (this[_protocol] === undefined) {
            
            let protocol;

            if (this.trustProxy 
                && this.trustProxy(this.request.connection.remoteAddress, 0)) {

                protocol = this.request.headers['x-forwarded-proto'];

                if (protocol && protocol.trim()) {
                    return protocol;
                }
            }

            if (this.request.connection.encrypted) {
                protocol = 'https';
            } else {
                protocol = 'http';
            }
            
            this[_protocol] = protocol;
        }

        return this[_protocol];
    }
    
    get statusCode() {
        
        return this.response.statusCode;
    }

    get subdomains() {

        if (this[_subdomains] === undefined) {
            
            const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            const ipv6Pattern = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;

            const hostname = this.hostname;

            if (ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname)) {
                return [];
            }

            const domains = hostname.split('.');

            let subdomainOffset = Number(this.config.subdomainOffset);

            if (!subdomainOffset
                || !Number.isInteger(subdomainOffset)
                || subdomainOffset < 0) {

                subdomainOffset = 0;
            }

            const _endIdx = Math.max(0, domains.length - subdomainOffset);
            
            this[_subdomains] = domains.slice(0, _endIdx).reverse();
        }    

        return this[_subdomains];
    }   
    
    set statusCode(code) {
        
        this.response.statusCode = code;
    }

    set statusMessage(message) {
        
        this.response.statusMessage = message;
    }

    download(path, filename, contentType, options) {
        
        this.result = new results.DownloadResult(this, path, filename, contentType, options);
        this.resolve();
    }

    next() {
        
        this.result = null;
        this.resolve();
    }

    redirect(url, statusCode) {
        
        this.statusCode = statusCode || 303;
        
        this.result = new results.RedirectResult(this, url);
        this.resolve();
    }
    
    redirectToRoute(name, params, query = null, validate = true, statusCode = null) {
        
        const url = this.routeURL(name, params, query, validate);
        
        this.redirect(url, statusCode);
    }
        
    removeHeader(name) {
        
        this.response.removeHeader(name);
        return this;
    }

    render(viewPath, locals, contentType) {

        if (arguments.length == 0) {
            viewPath = {};
        }

        if (arguments.length == 2 
            && typeof viewPath == 'string'
            && typeof locals == 'string') {
            
            contentType = locals;
            locals = {};
        
        } else if (viewPath && (typeof viewPath == 'object')) {

            if (arguments.length > 2) {
                throw new Error('Wrong Arguments: render([viewPath], [locals], [contentType])');
            }

            if (arguments.length == 2) {

                if (typeof locals != 'string') {
                    throw new Error('Argument error: [contentType]');
                }

                contentType = locals;
            }

            locals = viewPath;
            viewPath = undefined;
        }

        this.result = new results.ViewResult(this, viewPath, locals, contentType);
        this.resolve();
    }

    routeURL(name, params, query, validate = true) {

        const route = this.routes.find(x => x.actionRoute.name == name);

        if (!route) {
            return undefined;
        }

        let url;

        if (params && route.keys && route.keys.length) {

            const paramsPatternSource = route.keys
                .map(x => `:(${x})(?:<([^>]+)>)?`)
                .reduce((a, b) => a + '|' + b);

            const pattern = new RegExp(paramsPatternSource, 'g');

            let matchIndex = 0;

            url = route.routePath.replace(pattern, (...args) => {

                let paramName = args[matchIndex+1];
                let paramPattern = args[matchIndex + 2];
                let paramValue = params[paramName];
                
                matchIndex +=2;

                if (validate
                    && paramPattern
                    && String(paramValue).search(paramPattern) < 0) {

                    throw new Error(`Invalid route param value: ${paramValue}`);
                }

                return paramValue;
            });

        } else {
            url = route.routePath;
        }

        if (query && Object.keys(query).length > 0) {

            let formattedQuery = querystring.stringify(query);

            if (!url.endsWith('?')) {
                url += '?';
            }

            url += formattedQuery;
        }

        if (!this.config.route.caseSensitive) {
            url = url.toLowerCase();
        }

        return url;
    }    

    send(body, contentType) {
        
        this.result = new results.ContentResult(this, body, contentType);
        this.resolve();
    }

    sendJSON(body) {
        
        this.result = new results.JSONResult(this, body);
        this.resolve();
    }

    sendJSONP(data) {
        
        this.result = new results.JSONPResult(this, data);
        this.resolve();
    }

    sendFile(filePath, contentType, options) {
        
        this.result = new results.FileResult(this, filePath, contentType, options);
        this.resolve();
    }
    
    sendStatus(code, message) {
        
        this.statusCode = code;
        
        if (!message || !message.trim().length) {
            message = http.STATUS_CODES[code];
        }
        
        this.send(message);
    }
    
    setHeader(name, value) {
        
        this.response.setHeader(name, value);
        return this;
    }

    setHeaders(headers = {}) {
        
        if (headers instanceof Map) {
            
            for (let [key, value] of headers) {
                this.setHeader(key, value);   
            }       
        } else if (typeof(headers) == 'object') {
            
            for (let key of Object.keys(headers)) {
                this.setHeader(key, headers[key]);   
            }
        }
        
        return this;
    }
    
    skipToAction() {
        
        this.result = new results.SkipToActionResult()
        this.resolve();
    }

    stream(stream, contentType) {
        
        this.result = new results.StreamResult(this, stream, contentType);
        this.resolve();
    }
    
    throw(err) {
        
        this.result = null;
        this.reject(err);
    }
};
