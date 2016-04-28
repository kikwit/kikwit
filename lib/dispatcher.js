'use strict';

import http from 'http';
import os from 'os';
import path from 'path';
import url from 'url';

import appSettingsDefault from './appSettingsDefault';
import Context from './context';
import * as router from './router';
import { SkipToActionResult } from './actionResults';
import StaticFileResult from './actionResults/staticFileResult';

const defaultSettings = appSettingsDefault();

export function dispatch(appSettings, routes, request, response) {

    let ctx = new Context(appSettings, routes, request, response);
    
    if (!setRoute(ctx)) {
        
        if (getStaticFileResult(appSettings, ctx)) { 
            return;
        }
            
        return httpNotFoundError(appSettings, request, response);
    }

    parseQueryAndBody(ctx)
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

export function getStaticFileResult(appSettings, ctx) {

    if (!(appSettings.staticFiles
        && appSettings.staticFiles.root
        && appSettings.staticFiles.rootRegExp)) {
        return;
    }

    const matches = appSettings.staticFiles.rootRegExp.exec(ctx.pathname);

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

export function setRoute(ctx) {

    const result = router.findRoute(ctx.appSettings, ctx.routes, ctx.request, ctx.pathname);

    if (!result) {
        return false;
    }

    ctx.accept = result.accept;
    ctx.acceptVersion = result.acceptVersion;
    ctx.contentType = result.contentType;
    ctx.params = result.params;
    ctx.route = result.route;

    ctx.dependencies = result.route.dependencies;
    
    return true;
}

export function parseQueryAndBody(ctx) {

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

    ctx.query = queryParser(ctx.search);
}

function runBeforeInterceptors(ctx) {

    let interceptors = ctx.route.before;

    return runHandlers(ctx, ...interceptors);
}

function runAction(ctx) {

    let promise = new Promise((resolve, reject) => {

        // ctx['next'] = undefined;
        // ctx['skipToAction'] = undefined;

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

function runAfterInterceptors(ctx) {

    // ctx['next'] = contextMixins.next;

    let interceptors = ctx.route.after;

    return runHandlers(ctx, ...interceptors);
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











