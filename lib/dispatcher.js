'use strict';

import http from 'http';
import os from 'os';
import path from 'path';
import url from 'url';

import Promise from 'bluebird';

import baseConfig from './baseConfig';
import Context from './context';
import ContextWebSocket from './contextWebSocket';
import * as router from './router';
import { SkipToActionResult } from './actionResults';
import StaticFileResult from './actionResults/staticFileResult';
import EventResult from './actionResults/eventResult';

export function dispatch(config, trustProxy, routes, services, request, response) {

    let ctx = new Context(config, trustProxy, routes, request, response);

    const routeData = findRoute(config, routes, request);

    ctx.setRouteData(routeData);

    if (!routeData.routeInfo) {

        if (getStaticFileResult(ctx)) {
            return;
        }

        return httpNotFoundError(ctx, request, response);
    }

    injectServices(ctx, services)
        .then(parseQueryAndBody)
        .then(runBeforeInterceptors)
        .then(runAction)
        .then(runAfterInterceptors)
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

export function dispatchWebSocket(config, trustProxy, routes, services, webSocket) {

    var routeData = findRoute(config, routes, webSocket.upgradeReq);

    if (!routeData.routeInfo) {
        throw new Error('NOT FOUND');
    }

    let ctx = new ContextWebSocket(config, trustProxy, routes, webSocket, routeData);

    injectServices(ctx, services)
        .then(parseQuery)
        .then(() => {

            var route = ctx.route;
            var Controller = route.Controller;

            if (Controller.prototype['onClose']) {

                webSocket.on('close', (code, message) => {

                    ctx.body = { code, message };

                    let controller = new Controller();

                    controller.onClose(ctx);
                });
            }

            if (Controller.prototype['onConnection']) {

                let controller = new Controller();

                controller.onConnection(ctx);
            }

            if (Controller.prototype['onError']) {

                webSocket.on('error', (error) => {

                    ctx.error = error;

                    let controller = new Controller();

                    controller.onClose(ctx);
                });
            }
          
            if (Controller.prototype['onMessage']) {

                webSocket.on('message', (data, flags) => {

                    ctx.body = { data, flags };

                    let controller = new Controller();

                    controller.onMessage(ctx);
                });                            
            }

            if (Controller.prototype['onPing']) {

                webSocket.on('ping', (data, flags) => {

                    ctx.body = { data, flags };

                    let controller = new Controller();

                    controller.onPing(ctx);
                });                            
            }

            if (Controller.prototype['onPong']) {

                webSocket.on('pong', (data, flags) => {

                    ctx.body = { data, flags };

                    let controller = new Controller();

                    controller.onPong(ctx);
                });                            
            }

        });

}

export function getStaticFileResult(ctx) {

    if (!(ctx.config.staticFiles
        && ctx.config.staticFiles.root
        && ctx.config.staticFiles.rootRegExp)) {
        return;
    }

    const matches = ctx.config.staticFiles.rootRegExp.exec(ctx.pathname);

    if (!matches) {
        return;
    }

    const result = new StaticFileResult(ctx, matches[1]);

    return new StaticFileResult(ctx, matches[1])
        .execute()
        .catch(err => {

            if (err.code == 'ENOENT') {
                return httpNotFoundError(ctx.config, ctx.request, ctx.response);
            }

            return httpError(ctx, err);
        });
}

export function findRoute(config, routes, request) {

    const urlParts = parseUrl(request.url);
    const routeInfo = router.findRoute({ config, routes, request, pathname: urlParts.pathname });

    return { routeInfo, urlParts };
}

function parseUrl(requestUrl) {

    const parsedUrl = url.parse(requestUrl, true);

    const pathname = path.normalize(decodeURI(parsedUrl.pathname));
    const query = parsedUrl.query;
    const search = parsedUrl.search;
    const href = parsedUrl.href;

    const requestPath = pathname + search;

    return { pathname, query, search, href, path: requestPath };
}

export function injectServices(ctx, services) {

    return new Promise((resolve, reject) => {

        ctx.services = {};

        const route = ctx.route;

        if (!route.inject || !route.inject.length) {
            return resolve(ctx);;
        }

        let ctxServiceEntries = [];
        let serviceEntry;
        let service;
        let singletonScope;
        let routeScope;

        for (let key of route.inject) {

            singletonScope = false;
            routeScope = false;

            if (key.startsWith('@@')) {

                routeScope = true;
                key = key.slice(2);

            } else if (key.startsWith('@')) {

                singletonScope = true;
                key = key.slice(1);
            }

            serviceEntry = services.get(key);

            if (!serviceEntry) {
                throw new Error(`Invalid dependency [${key}] for route [${route.routePath}]`)
            }

            if (serviceEntry.singleton || singletonScope) {

                if (!serviceEntry.instance) {
                    serviceEntry.instance = new serviceEntry.Class();
                }

                service = serviceEntry.instance;

            } else if (routeScope) {

                if (!route.services[key]) {
                    route.services[key] = new serviceEntry.Class();
                }

                service = route.services[key];

            } else {

                service = new serviceEntry.Class();
            }

            ctxServiceEntries.push(serviceEntry);

            ctx.services[key] = service;

            injectDependentServices(ctx.config, service, serviceEntry, services);
        };

        resolve(ctx);
    });
}

function injectDependentServices(config, service, serviceEntry, services, visited = new Set()) {

    service.services = {};
    service.config = config;

    for (let [key, svcSingleton] of serviceEntry.servicesSingleton) {

        service.services[key] = svcSingleton;
    }

    for (let [key, svcPrototype] of serviceEntry.servicesPrototype) {

        service.services[key] = new svcPrototype();
    }

    visited.add(service);

    let svc, svcEntry;

    for (let key of Object.keys(service.services)) {

        svc = service.services[key];

        if (visited.has(svc)) {
            continue;
        }

        svcEntry = services.get(key);

        injectDependentServices(config, svc, svcEntry, services, visited);
    }
}

export function parseQueryAndBody(ctx) {

    parseQuery(ctx);

    let bodyParser = ctx.route.bodyParser;

    if (bodyParser === false) {
        return Promise.resolve(ctx);
    }

    if (!bodyParser) {

        bodyParser = ctx.config.bodyParser;

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

        queryParser = ctx.config.queryParser;

        if (!queryParser) {
            return ctx;
        }
    }

    ctx.query = queryParser(ctx.search.slice(1));
}

function runBeforeInterceptors(ctx) {

    let interceptors = ctx.route.before;

    return runHandlers(ctx, ...interceptors);
}

function runAction(ctx) {

    let promise = new Promise((resolve, reject) => {

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

            return handleOnError(ctx, err);
        }

        throw err;
    });
}

function handleOnError(ctx, err) {

    ctx.error = err;

    return runHandlers(ctx, ctx.route.onError)
        .then(() => {

            return ctx;
        }).catch(err2 => {

            if (err2) {
                throw err2;
            }

            return disposeResources(ctx)
                .then(() => {
                    return Promise.reject();
                }).catch(err3 => {
                    return Promise.reject(err3);
                })
        });
}

function runAfterInterceptors(ctx) {

    let interceptors = ctx.route.after;

    return runHandlers(ctx, ...interceptors);
}

function disposeResources(ctx) {

    if (ctx.disposeResources === false) {
        return;
    }

    ctx.response.end();

    return Promise.resolve(ctx);
}

function runHandlers(ctx, ...handlers) {

    if (!handlers || !handlers.length) {
        return Promise.resolve(ctx);
    }

    let idx = 0;

    let runHandlerFn = function (hdlr) {

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

    if (!result) {
        return Promise.resolve();
    }

    return result.run()
        .then(() => {

            ctx.result = ctx.actionResult = null;

            if (result instanceof EventResult
                && !ctx.connectionClosed
                && result.interval > 0) {

                ctx.disposeResources = false;

                scheduleServerSentEvent(ctx, result);

            }

            return ctx;
        })
        .catch(err => {

            if (!ctx.error && ctx.route.onError) {

                return handleOnError(ctx, err);
            }

            throw err;
        });
}

function scheduleServerSentEvent(ctx, result) {

    ctx.lastEventId = (result.event || {}).id;

    setTimeout(() => {

        runAction(ctx)
            .then(executeResult); // TODO Catch SSE error

    }, result.interval);
}

function httpNotFoundError(ctx, request, response) {
    httpErrorByCode(404, ctx, request, response);
}

function httpErrorByCode(httpStatusCode, ctx, request, response) {

    httpStatusCode = (httpStatusCode || 500);

    let err = new Error(http.STATUS_CODES[httpStatusCode]);

    err.httpStatusCode = httpStatusCode;

    httpError(ctx, err);
}

function httpError(ctx, err) {

    const errorHdls = ctx.config.errors;

    let hdl = errorHdls[err.httpStatusCode];

    if (!hdl) {

        const defaultCode = 500;

        hdl = errorHdls[defaultCode] || baseConfig().errors[defaultCode];
    }

    ctx.error = err;

    hdl(ctx);
}
