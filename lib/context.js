'use strict';

import http from 'http';
import net from 'net';
import path from 'path';
import querystring from 'querystring';
import url from 'url';

import Cookies from 'cookies';
import mimeTypes from 'mime-types';
import proxyAddr from 'proxy-addr';

import * as results from './actionResults';
import { head } from './decorators/httpMethods';

const _cookies = Symbol();
const _host = Symbol();
const _hostname = Symbol();
const _ips = Symbol();
const _lastEventId = Symbol();
const _port = Symbol();
const _protocol = Symbol();
const _subdomains = Symbol();

export default class Context {

    constructor(config, trustProxy, routes, request, response) {

        this.config = config;
        this.trustProxy = trustProxy;
        this.request = request;
        this.response = response;
        this.routes = routes;
        
        this.pushFiles = [];
        this.locals = {};
    }

    setRouteData(routeData) {

        var routeInfo = routeData.routeInfo;

        if (routeInfo) {
                
            this.route = routeInfo.route;
            this.accept = routeInfo.accept;
            this.contentType = routeInfo.contentType;
            this.params = routeInfo.params; 
        }

        const urlParts = routeData.urlParts;

        this.pathname = urlParts.pathname;
        this.query = urlParts.query;
        this.search = urlParts.search;
        this.href = urlParts.href;   
        this.path = urlParts.path;         
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

    get lastEventId() {

        if (this[_lastEventId] === undefined) {

            this[_lastEventId] = this.request.headers['last-event-id'];
        }

        return this[_lastEventId];
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

            const hostname = this.hostname;

            if (net.isIP(hostname) != 0) {
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

    set lastEventId(id) {

        this[_lastEventId] = id;
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

    noEvent() {

        this.sendEvent();
    }

    push(filePath, contentType) {

        if (!contentType) {
            contentType = mimeTypes.contentType(path.extname(filePath)) || 'text/plain';
        }
        
        this.pushFiles.push(
            { 
                path: filePath,
                headers: {
                    'Content-Type': contentType
                }
            }
        );
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

        // if (!this.config.route.caseSensitive) {
            url = url.toLowerCase();
        // }

        return url;
    }    

    send(body, contentType) {
        
        this.result = new results.ContentResult(this, body, contentType);
        this.resolve();
    }

    sendEvent(eventDetails, interval) {

        this.result = new results.EventResult(this, eventDetails, interval);
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
        
        this.result = new results.SkipToActionResult();
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
