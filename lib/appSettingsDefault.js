'use strict';

import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import querystring from 'querystring';
import url from 'url';
import util from 'util';

import accepts from 'accepts';
import Busboy from 'busboy';
import Promise from 'bluebird';
import typeIs from 'type-is';
import uuid from 'node-uuid';

export default () => ({

	bodyParser: bodyParser,
	controllersRoot: 'controllers',
    cookieParser: {
        keys: [Math.random().toString(16).slice(2)]  
    },
    dependencies: {},
	environment: 'development',
	errors: {
		[404]: httpError(404),
		[500]: httpError(500)
	},
	json: {
		callbackParam: 'callback',
		parser: JSON.parse,
		replacer: undefined,
		space: undefined
	},
	queryParser: querystring.parse,
	requestLimits: {
		maxSize: 5 * 1024 * 1024, /* integer - For JSON and text body only (in bytes) */
		fieldNameSize: 100, // Max field name size (in bytes) 
		fields: 1024, // integer - Max number of non-file fields.
		fieldSize: 1 * 1024 * 1024, // integer - Max field value size (in bytes) 
		files: 20, // integer - For multipart forms, the max number of file fields.
		fileSize: 10 * 1024 * 1024, /* integer - For multipart forms, the max file size (in bytes) */
		maxHeadersCount: 1000 // Maximum incoming headers count
	},
	route: {
		caseSensitive: false,
		strict: false
	},
    staticFiles: {
        allowDotFiles: false,
        compress: true, // false | TRUE | (req) => boolean use compression if the user-agent allows it, i.e. if accept-encoding header includes gzip, deflate, etc...
        headers: (path) => {}, // {} || (path) => {}
        index: ['index.html'], /* 'index.html', false */
        lastModified: true,
        maxAge: 0,    
        root: 'public'
    },
	// trustProxy: false
	views: {
		defaultEngine: undefined,
		engines: undefined,
		pathResolver: viewPathResolver,
		root: 'views'
	}
});

function httpError(httpStatusCode) {

	return function (ctx) {

		let contentType;
		let body;
		
		if (ctx.appSettings.environment.toLowerCase() == 'development') {
			body = ctx.error.stack;
		} 
		
		if (!body || !body.trim()) {
			body = http.STATUS_CODES[httpStatusCode];
		}
		
		const accept = accepts(ctx.request).type(['html', 'json']);
		
		switch(accept) {
			case 'html':
				contentType = 'text/html';
				body = `<pre>${body}</pre>`;
				break;
			case 'json':
				contentType = 'application/json';
				break;
			default:
				contentType = 'text/plain';	
				break;
		}
		
		const res = ctx.response;
		
		res.statusCode = httpStatusCode;
		res.setHeader('Content-Type', contentType);
		res.end(body);	
	};
}

function bodyParser(ctx) {

	const req = ctx.request;

	if (!typeIs.hasBody(req)) {
		return Promise.resolve(undefined);
	}

	const urlEncodedOrMultipart = typeIs(req, ['urlencoded', 'multipart']);

	if (urlEncodedOrMultipart) {
		return processUrlEncodedOrMultipart(ctx);
	}

	return new Promise((resolve, reject) => {

		const requestMaxSize = ctx.appSettings.requestLimits.maxSize;

		let data = [];
		let dataLength = 0;

		req.on('data', function (chunk) {

			dataLength += chunk.length;

			if (requestMaxSize && (dataLength > requestMaxSize)) {
				data = null;
				return reject(entityTooLargeError());
			}

			data.push(chunk);
		});

		req.on('end', function () {

			const encoding = 'utf8';
			const buffer = Buffer.concat(data);

			const encType = typeIs(req, ['text', 'json']);

			let parsedBody;

			switch (encType) {

				case 'text':

					parsedBody = buffer.toString(encoding);
					return resolve(parsedBody);

				case 'json':

					parsedBody = ctx.appSettings.json.parser(buffer.toString(encoding));
					return resolve(parsedBody);

				default:

					return resolve(buffer);
			}
		});
	});
}

function processUrlEncodedOrMultipart(ctx) {

	return new Promise((resolve, reject) => {

		const req = ctx.request;
		const requestLimits = ctx.appSettings.requestLimits;
		const fieldsData = [];
		const files = {};

		const busboy = new Busboy({
			headers: req.headers,
			limits: {
				fieldNameSize: requestLimits.fieldNameSize,
				fields: requestLimits.fields,
				fieldSize: requestLimits.fieldSize,
				files: requestLimits.files,
				fileSize: requestLimits.fileSize,
				headerPairs: requestLimits.maxHeadersCount
			}
		});

		busboy.on('file', (fieldName, stream, filename, transferEncoding, mimeType) => {

            if (!filename || !filename.trim()) {
                stream.resume();
                return;
            }

			const destPath = path.join(os.tmpdir(), uuid.v1());

			files[fieldName] = {
				encoding: transferEncoding,
				mimeType: mimeType,
				originalName: path.basename(filename),
				path: destPath
			};

			const destStream = fs.createWriteStream(destPath);

			stream.pipe(destStream);
		});

		busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated) => {

			if (fieldnameTruncated || valTruncated) {
				return reject(entityTooLargeError());
			}

			fieldsData.push(`${ encodeURIComponent(fieldname) }=${ encodeURIComponent(val) }`);
		});

		busboy.on('partsLimit', () => {
			return reject(entityTooLargeError());
		});

		busboy.on('filesLimit', () => {
			return reject(entityTooLargeError());
		});

		busboy.on('fieldsLimit', () => {
			return reject(entityTooLargeError());
		});

		busboy.on('finish', () => {

			const str = fieldsData.join('&');
			const parsedBody = ctx.appSettings.queryParser(str);
                      
			return resolve({ parsedBody, files });
		});

		req.pipe(busboy);
	});
}

function viewPathResolver(ctx, viewPath, locals, contentType) {

	const pathSeparator = '/';
	
	let resolvedPath;
	
	if (viewPath) {
		resolvedPath = viewPath.trim();
	} 
	
	if (!resolvedPath) {
		resolvedPath = (ctx.controllerName + pathSeparator + ctx.actionName);	
	}
	
	if (!resolvedPath.includes(pathSeparator)) {
		resolvedPath = ctx.controllerName + pathSeparator + resolvedPath;
	}
		
	const viewsSettings = ctx.appSettings.views;
	
	if (!path.extname(resolvedPath)) {

		const defaultEngine = viewsSettings.defaultEngine;
		const viewsEngines = Object.keys(viewsSettings.engines);

		if (defaultEngine && viewsEngines.indexOf(defaultEngine) >= 0) {
			resolvedPath += '.' + defaultEngine;
		} else if (viewsEngines.length == 1) {
			resolvedPath += '.' + viewsEngines[0];
		} else {
			throw new Error('View engine not found');
		}
	}
	
	resolvedPath = path.join(viewsSettings.root, resolvedPath);
	
	return resolvedPath;
}

function entityTooLargeError() {

	const err = Error();

	err.httpStatusCode = 413;

	return err;
}
