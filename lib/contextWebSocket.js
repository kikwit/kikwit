'use strict';

import http from 'http';
import path from 'path';
import querystring from 'querystring';
import url from 'url';

import Cookies from 'cookies';
import proxyAddr from 'proxy-addr';

import * as results from './actionResults/webSockets';
import SkipToActionResult from './actionResults/skipToActionResult';

const _cookies = Symbol();
const _host = Symbol();
const _hostname = Symbol();
const _ips = Symbol();
const _port = Symbol();
const _protocol = Symbol();
const _subdomains = Symbol();

export default class ContextWebSocket {

    constructor(config, trustProxy, routes, webSocket, routeData) {

        this.config = config;
        this.trustProxy = trustProxy;
        this.routes = routes;
        
        this.webSocket = webSocket;
        this.copyWebSocketProperties(); 
        
        this.locals = {};
        this.pseudoResponse = {
            headers: {}
        };

        this.setRouteData(routeData);
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

    copyWebSocketProperties() {


        this.stream = this.webSocket.stream.bind(this.webSocket);
        this.terminate = this.webSocket.terminate.bind(this.webSocket); 
    }
    
    get cookies() {
        
        if (this[_cookies] === undefined) {
            
            let cookies = {};
            
            if (this.config.cookieParser) {

                cookies = new Cookies(this.webSocket.upgradeReq, this.pseudoResponse, {
                    keys: this.config.cookieParser.keys
                });
            }
           
            this[_cookies] = cookies;       
        }
        
        return this[_cookies];
    }
    
    get headers() {
        
        return this.webSocket.upgradeReq.headers;
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
                && this.trustProxy(this.webSocket.upgradeReq.connection.remoteAddress, 0)) {

                hostname = this.webSocket.upgradeReq.headers['x-forwarded-host'];
            }

            if (!hostname || !hostname.trim()) {
                hostname = this.webSocket.upgradeReq.headers['host'];
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

                ips = proxyAddr.all(this.webSocket.upgradeReq, this.trustProxy) || [];

                ips && ips.reverse();
            } 
            
            if (!ips || !ips.length) {
                ips = [this.webSocket.upgradeReq.connection.remoteAddress];
            }

            this[_ips] = ips;
        }

        return this[_ips];
    }

    get port() {

        if (this[_port] === undefined) {
            
            let port;

            if (this.trustProxy 
                && this.trustProxy(this.webSocket.upgradeReq.connection.remoteAddress, 0)) {
                    
                port = this.webSocket.upgradeReq.headers['x-forwarded-port'];
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
                && this.trustProxy(this.webSocket.upgradeReq.connection.remoteAddress, 0)) {

                protocol = this.webSocket.upgradeReq.headers['x-forwarded-proto'];

                if (protocol && protocol.trim()) {
                    return protocol;
                }
            }

            if (this.webSocket.upgradeReq.connection.encrypted) {
                protocol = 'https';
            } else {
                protocol = 'http';
            }
            
            this[_protocol] = protocol;
        }

        return this[_protocol];
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

    close(code, data) {

        this.result = new results.CloseResult(this, code, data);
        this.resolve();
    }

    next() {
        
        this.result = null;
        this.resolve();
    }    

    pause() {

        this.result = new results.PauseResult(this);
        this.resolve();
    }

    ping(data, options, dontFailWhenClosed) {

        this.result = new results.PingResult(this, data, options, dontFailWhenClosed);
        this.resolve();
    }

    pong(data, options, dontFailWhenClosed) {

        this.result = new results.PongResult(this, data, options, dontFailWhenClosed);
        this.resolve();
    }

    resume() {

        this.result = new results.ResumeResult(this);
        this.resolve();
    }

    send(data, options, callback) {

        this.result = new results.ContentResult(this, data, options, callback);
        this.resolve();
    }

    skipToAction() {
        
        this.result = new SkipToActionResult(this);
        this.resolve();
    }

    terminate(data, options, callback) {

        this.result = new results.TerminateResult(this);
        this.resolve();
    }

    throw(err) {
        
        this.result = null;
        this.reject(err);
    }
};
