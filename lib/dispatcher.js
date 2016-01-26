'use strict';

import domain from 'domain';
import http from 'http';
import os from 'os';
import path from 'path';
import url from 'url';

import accepts from 'accepts';
import Promise from 'bluebird';
import semver from 'semver';
import typeIs from 'type-is';

import * as contextMixins from './contextMixins';
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

    var ctxDomain = createDomain(ctx);

	ctxDomain.run(() => {
        
        if (appSettings.staticFiles
            && appSettings.staticFiles.root
            && appSettings.staticFiles.rootRegExp) {
                
            let staticFilePath = getStaticFilePath(appSettings, request.url);
            
            if (staticFilePath) { 
                
               const result = new StaticFileResult(ctx, staticFilePath);
               
               return result
                        .execute()
                        .catch(err => {
                            if (err.code == 'ENOENT') {    
                                return httpNotFoundError(ctx.appSettings, ctx.request, ctx.response);
                            } 
                        })
            }
        }

		findRoute(ctx)
			.then(parseQuery)
			.then(parseBody)
			.then(runBeforeHandlers)
			.then(runAction)
			.then(runAfterHandlers)
			.then(executeResult)
			.then(disposeResources)
			.catch(err => {

				if (ctx && ctx.requestHandled) {
					return null;
				}

				// TODO Log err
				return httpError(ctx, err);
			});
	});
}

function createDomain(ctx) {
	
    const ctxDomain = domain.create();

    ctxDomain.add(ctx.request);
    ctxDomain.add(ctx.response);

    ctxDomain.on('error', (err) => {

		console.error('Error', err, ctx.request.url);

		try {
			return httpError(ctx, err);

		} catch (ex) {
			console.error('Error sending 500', err, ctx.request.url);
		}
    });	
		
	ctx.response.on("close", function (){
		ctxDomain.exit ();
	});

	return ctxDomain;
}

export function getStaticFilePath(appSettings, requestUrl) {
        
    const pathname = url.parse(requestUrl).pathname;
    
    const matches = appSettings.staticFiles.rootRegExp.exec(pathname);
    
    if (matches) {
        return path.join(
            process.cwd(), 
            appSettings.staticFiles.root, 
            matches[1]
        );
    }

    return null;;
}

export function findRoute(ctx) {

	return new Promise((resolve, reject) => {

		const result = router.findRoute(ctx.appSettings, ctx.routes, ctx.request);

		if (!result) {

			let err = new TypeError();

			err.httpStatusCode = 404;

			return reject(err);
		}

		ctx = Object.assign(ctx, result);
        
        ctx.dependencies = result.route.dependencies;
        
		resolve(ctx);
	});
}

export function parseQuery(ctx) {

	let queryParser = ctx.route.queryParser;

	if (queryParser === false) {
		return Promise.resolve(ctx);
	}

	if (!queryParser) {

		queryParser = ctx.appSettings.queryParser;

		if (!queryParser) {
			return Promise.resolve(ctx);
		}
	}

	const parsedUrl = url.parse(ctx.request.url);

	ctx.query = queryParser(parsedUrl.query);

	return Promise.resolve(ctx);
}

export function parseBody(ctx) {

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
                ctx.body =result.body;
                ctx.files = result.files;                
            }

			return Promise.resolve(ctx);
		});
}

function runBeforeHandlers(ctx) {

	ctx = Object.assign({}, ctx, contextMixins.defaults, contextMixins.handlers, contextMixins.before);

	let handlers = ctx.route.before;

	return runHandlers(ctx, handlers);
}

function runAction(ctx) {

	let promise = new Promise((resolve, reject) => {

		const keys = Object.keys(contextMixins.handlers) || [];

		keys.push(...(Object.keys(contextMixins.before) || []));

		keys.forEach(x => ctx[x] = undefined);

		let route = ctx.route;

		let controller = new route.Controller();

		ctx.resolve = resolve;
		ctx.reject = reject;

		try {
			controller[route.actionName](ctx);
		} catch (ex) {
			return reject(ex);
		}
	});

	return promise.then(() => {

		ctx.actionResult = ctx.result;
		ctx.result = undefined;

		return Promise.resolve(ctx);
	}).catch(err => {
		throw err;
	});
}

function runAfterHandlers(ctx) {

	ctx = Object.assign(ctx, contextMixins.handlers);

	let handlers = ctx.route.after;

	return runHandlers(ctx, handlers);
}

function disposeResources(ctx) {

	ctx.response.end();

	return Promise.resolve(ctx);
}

function runHandlers(ctx, handlers) {
    
    if (!handlers || !handlers.length) {
        return Promise.resolve(ctx);
    }

    let idx = 0;

    let runHandlerFn = function (hdlr) {

        let promise = new Promise((resolve, reject) => {

            ctx.resolve = resolve;
            ctx.reject = reject;

            try {
                hdlr(ctx);
            } catch (ex) {
                return reject(ex);
            }
        });

        return promise.then(() => {

            ctx.resolve = undefined;
            ctx.reject = undefined;

            if (ctx.result) {

                if (ctx.result instanceof SkipToActionResult) {
                    return ctx;
                }

                ctx.requestHandled = true;

                return executeResult(ctx).then(() => {
                    throw new Error();
                });
            }

            if (idx < handlers.length - 1) {
                return runHandlerFn(handlers[++idx]);
            }

            return ctx;

        }).catch(err => {
            throw err;
        });;
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

	let err = new TypeError(http.STATUS_CODES[httpStatusCode]);

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
