'use strict';

import path from 'path';
import querystring from 'querystring';
import url from 'url';

import Cookies from 'cookies';

import appSettingsDefault from './appSettingsDefault';
import * as results from './actionResults';

const _cookies = Symbol();

export default class {

    constructor(appSettings, routes, request, response) {

        this.appSettings = appSettings;
        this.request = request;
        this.response = response;
        this.routes = routes;
        
        this.state = {};
        
        this.parsedUrl();
    }
    
    parsedUrl() {

        const parsedUrl = url.parse(this.request.url, true);

        this.pathname = path.normalize(decodeURI(parsedUrl.pathname));
        this.query = parsedUrl.query;
        this.search = parsedUrl.search;
        this.url = parsedUrl.url;
                
        this.path = this.pathname + this.search;
    }
    
    get cookies() {
        
        if (this[_cookies] === undefined) {
            
            let cookies = {};
            
            if (this.appSettings.cookieParser) {

                cookies = new Cookies(this.request, this.response, {
                    keys: this.appSettings.cookieParser.keys
                });
            }
           
            this[_cookies] = cookies;       
        }
        
        return this[_cookies];
    }
         
    get host() {

        return `${this.hostname}:${this.port}`;
    }

    get hostname() {

        let hostname;

        if (this.appSettings.trustProxy) {
            hostname = this.request.headers['x-forwarded-host'];
        }

        if (!hostname || !hostname.trim()) {
            hostname = this.request.headers['host'];
        }

        const portSep = ':';

        if (hostname.includes(portSep)) {
            hostname = hostname.split(portSep)[0];
        }

        return hostname;
    }
    
    get ip() {

        return this.ips[0];
    }    
    
    get ips() {

        let ips;

        if (this.appSettings.trustProxy) {
            ips = this.request.headers['x-forwarded-for'];
        }

        if (ips && ips.trim()) {
            ips = ips.split(',');
        } else {
            ips = [this.request.connection.remoteAddress];
        }

        return ips;
    }

    get logger() {
        
        return  this.appSettings.logger;
    }
    
    get port() {

        let port;

        if (this.appSettings.trustProxy) {
            port = this.request.headers['x-forwarded-port'];
        }

        if (!port || !port.trim()) {
            port = this.appSettings.server.port;
        }

        return port;
    }

    get protocol() {

        let protocol;

        if (this.appSettings.trustProxy) {

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

        return protocol;
    }

    get subdomains() {

        const ipv4Pattern = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
        const ipv6Pattern = /^s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:)))(%.+)?s*/;

        const hostname = this.hostname;

        if (ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname)) {
            return [];
        }

        const domains = hostname.split('.');

        let subdomainOffset = Number(this.appSettings.subdomainOffset);

        if (!subdomainOffset
            || !Number.isInteger(subdomainOffset)
            || subdomainOffset < 0) {

            subdomainOffset = 0;
        }

        const _endIdx = Math.max(0, domains.length - subdomainOffset);

        return domains.slice(0, _endIdx).reverse();
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

    throw(err) {
        
        this.result = null;
        this.reject(err);
    }

    next() {
        
        this.result = null;
        this.resolve();
    }

    redirect(url, statusCode) {
        
        this.result = new results.RedirectResult(this, url, statusCode);
        this.resolve();
    }
    
    removeHeader(name) {
        
        this.response.removeHeader(name);
        return this;
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

    sendFile(path, contentType, options) {
        
        this.result = new results.FileResult(this, path, contentType, options);
        this.resolve();
    }
    
    sendStatus(code, message) {
        
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

    render(viewPath, locals, contentType) {

        if (arguments.length == 0) {
            viewPath = {};
        }

        if (viewPath && (typeof viewPath == 'object')) {

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

                return params[paramName];
            });

        } else {
            url = route.routePath;
        }

        if (query) {

            let formattedQuery = querystring.stringify(query);

            if (!url.endsWith('?')) {
                url += '?';
            }

            url += formattedQuery;
        }

        return url;
    }
};
