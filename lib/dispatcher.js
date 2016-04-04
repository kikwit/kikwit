'use strict';

import domain from 'domain';
import http from 'http';
import os from 'os';
import path from 'path';
import url from 'url';

import Cookies from 'cookies';
import Promise from 'bluebird';
import semver from 'semver';
import typeIs from 'type-is';

import contextMixins from './contextMixins';
import * as router from './router';
import appSettingsDefault from './appSettingsDefault';
import { SkipToActionResult } from './actionResults';
import StaticFileResult from './actionResults/staticFileResult';

const defaultSettings = appSettingsDefault();

export function dispatch(appSettings, routes, request, response) {

    let ctx = {
        appSettings,
        request,
        response,
        routes
    };

    const parsedUrl = url.parse(request.url);
    const requestPath = path.normalize(decodeURI(parsedUrl.pathname));

    if (getStaticFileResult(appSettings, ctx, requestPath)) {
        return;
    }

    addGetter(ctx, 'subdomains', subdomains);
    addGetter(ctx, 'protocol', protocol);
    addGetter(ctx, 'hostname', hostname);
    addGetter(ctx, 'ips', ips);
    addGetter(ctx, 'ip', ip);
    addGetter(ctx, 'port', port);
    addGetter(ctx, 'host', host);

    Object.assign(ctx, contextMixins);

    var route = findRoute(ctx, requestPath);

    if (!route) {
        return httpNotFoundError(appSettings, request, response);
    }

    parseQueryAndBody(ctx)
        .then(runBeforeHandlers)
        .then(runAction)
        .then(runAfterHandlers)
        .then(executeResult)
        .then(disposeResources)
        .catch(err => {

            if (!err
                && (ctx.response.headersSent || ctx.response.finished)) {
                return null;
            }
            // TODO Log err
            return httpError(ctx, err);
        });
}

export function getStaticFileResult(appSettings, ctx, requestPath) {

    if (!(appSettings.staticFiles
        && appSettings.staticFiles.root
        && appSettings.staticFiles.rootRegExp)) {
        return;
    }

    const matches = appSettings.staticFiles.rootRegExp.exec(requestPath);

    if (!matches) {
        return;
    }

    const result = new StaticFileResult(ctx, matches[1]);

    return new StaticFileResult(ctx, matches[1])
        .execute()
        .catch(err => {

            if (err.code == 'ENOENT') {
                return httpNotFoundError(ctx.appSettings, ctx.request, ctx.response);
            }

            return httpError(ctx, err);
        });
}

export function findRoute(ctx, requestPath) {

    const result = router.findRoute(ctx.appSettings, ctx.routes, ctx.request, requestPath);

    if (result) {

        ctx = Object.assign(ctx, result);

        ctx.dependencies = result.route.dependencies;
    }

    return result;
}

export function parseQueryAndBody(ctx) {

    if (ctx.appSettings.cookieParser) {

        var cookies = new Cookies(ctx.request, ctx.response, {
            keys: ctx.appSettings.cookieParser.keys
        });

        ctx.cookies = cookies;
    }

    parseQuery(ctx);

    let bodyParser = ctx.route.bodyParser;

    if (bodyParser === false) {
        return Promise.resolve(ctx);
    }

    if (!bodyParser) {

        bodyParser = ctx.appSettings.bodyParser;

        if (!bodyParser) {
            return Promise.resolve(ctx);
        }
    }

    return bodyParser(ctx)
        .then(result => {

            if (result) {
                ctx.body = result.body;
                ctx.files = result.files;
            }

            return Promise.resolve(ctx);
        });
}

export function parseQuery(ctx) {

    let queryParser = ctx.route.queryParser;

    if (queryParser === false) {
        return;
    }

    if (!queryParser) {

        queryParser = ctx.appSettings.queryParser;

        if (!queryParser) {
            return ctx;
        }
    }

    const parsedUrl = url.parse(ctx.request.url);

    ctx.query = queryParser(parsedUrl.query);
}

function runBeforeHandlers(ctx) {

    let handlers = ctx.route.before;

    return runHandlers(ctx, ...handlers);
}

function runAction(ctx) {

    let promise = new Promise((resolve, reject) => {

        ctx['next'] = undefined;
        ctx['skipToAction'] = undefined;

        let route = ctx.route;

        let controller = new route.Controller();

        ctx.resolve = resolve;
        ctx.reject = reject;

        controller[route.actionName](ctx);
    });

    return promise.then(() => {

        ctx.actionResult = ctx.result;
        ctx.result = undefined;
        
        return ctx;
        
    }).catch(err => {

        if (!ctx.error && ctx.route.onError) {
            
            ctx.error = err;
            
            return runHandlers(ctx, ctx.route.onError);
        }

        throw err;
    });
}

function runAfterHandlers(ctx) {

    ctx['next'] = contextMixins.next;

    let handlers = ctx.route.after;

    return runHandlers(ctx, ...handlers);
}

function disposeResources(ctx) {

    ctx.response.end();

    return Promise.resolve(ctx);
}

function runHandlers(ctx, ...handlers) {

    if (!handlers || !handlers.length) {
        return Promise.resolve(ctx);
    }

    let idx = 0;

    let runHandlerFn = function(hdlr) {

        let promise = new Promise((resolve, reject) => {

            ctx.resolve = resolve;
            ctx.reject = reject;

            hdlr(ctx);
        });

        return promise.then(() => {

            ctx.resolve = undefined;
            ctx.reject = undefined;

            if (ctx.result) {

                if (ctx.result instanceof SkipToActionResult) {
                    return ctx;
                }

                return executeResult(ctx).then(() => {
                    return Promise.reject();
                });
            }

            if (idx < handlers.length - 1) {
                return runHandlerFn(handlers[++idx]);
            }

            return ctx;

        }).catch(err => {
            throw err;
        });
    };

    return runHandlerFn(handlers[idx]);
}

function executeResult(ctx) {

    const result = ctx.result || ctx.actionResult;

    return result.run()
        .then(() => {

            ctx.result = ctx.actionResult = null;

            return ctx;
        })
        .catch(err => {
            
            if (!ctx.error && ctx.route.onError) {
                
                ctx.error = err;
                
                return runHandlers(ctx, ctx.route.onError);
            }            
            
            throw err;
        });
}

function httpNotFoundError(appSettings, request, response) {
    httpErrorByCode(404, appSettings, request, response);
}

function httpErrorByCode(httpStatusCode, appSettings, request, response) {

    let ctx = {
        appSettings,
        request,
        response
    };

    httpStatusCode = (httpStatusCode || 500);

    let err = new Error(http.STATUS_CODES[httpStatusCode]);

    err.httpStatusCode = httpStatusCode;

    httpError(ctx, err);
}

function httpError(ctx, err) {
    
    const errorHdls = ctx.appSettings.errors;

    let hdl = errorHdls[err.httpStatusCode];

    if (!hdl) {

        const defaultCode = 500;

        hdl = errorHdls[defaultCode] || defaultSettings.errors[defaultCode];
    }

    ctx.error = err;

    hdl(ctx);
}


function addGetter(obj, propertyKey, fn, enumerable = true, configurable = false) {

    Object.defineProperty(obj, propertyKey, {
        enumerable,
        configurable,
        get() {
            return fn(obj);
        }
    });
}

function subdomains(ctx) {

    const ipv4Pattern = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
    const ipv6Pattern = /^s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:)))(%.+)?s*/;

    const hostname = ctx.hostname;

    if (ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname)) {
        return [];
    }

    const domains = hostname.split('.');

    let subdomainOffset = Number(ctx.appSettings.subdomainOffset);

    if (!subdomainOffset
        || !Number.isInteger(subdomainOffset)
        || subdomainOffset < 0) {

        subdomainOffset = 0;
    }

    const _endIdx = Math.max(0, domains.length - subdomainOffset);

    return domains.slice(0, _endIdx).reverse();
}

function protocol(ctx) {

    let protocol;

    if (ctx.appSettings.trustProxy) {

        protocol = ctx.request.headers['x-forwarded-proto'];

        if (protocol && protocol.trim()) {
            return protocol;
        }
    }

    if (ctx.request.connection.encrypted) {
        protocol = 'https';
    } else {
        protocol = 'http';
    }

    return protocol;
}

function hostname(ctx) {

    let hostname;

    if (ctx.appSettings.trustProxy) {
        hostname = ctx.request.headers['x-forwarded-host'];
    }

    if (!hostname || !hostname.trim()) {
        hostname = ctx.request.headers['host'];
    }

    const portSep = ':';

    if (hostname.includes(portSep)) {
        hostname = hostname.split(portSep)[0];
    }

    return hostname;
}

function ips(ctx) {

    let ips;

    if (ctx.appSettings.trustProxy) {
        ips = ctx.request.headers['x-forwarded-for'];
    }

    if (ips && ips.trim()) {
        ips = ips.split(',');
    } else {
        ips = [ctx.request.connection.remoteAddress];
    }

    return ips;
}

function ip(ctx) {

    return ctx.ips[0];
}

function port(ctx) {

    let port;

    if (ctx.appSettings.trustProxy) {
        port = ctx.request.headers['x-forwarded-port'];
    }

    if (!port || !port.trim()) {
        port = ctx.appSettings.server.port;
    }

    return port;
}

function host(ctx) {

    return `${ctx.hostname}:${ctx.port}`;
}
