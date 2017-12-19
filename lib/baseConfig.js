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
import mustache from 'mustache';
import Promise from 'bluebird';
import typeIs from 'type-is';

export default () => ({

    bodyParser: bodyParser,
    cluster: false,
    controllersRoot: 'controllers',
    cookieParser: {
        keys: [Math.random().toString(16).slice(2)]
    },
    dependencies: {},
    environment: 'development',
    errors: {
        [404]: httpError(404, true),
        [500]: httpError(500)
    },
    http: {
        port: 3000
    },     
    https: {
        port: 3001,
        // cert,
        // key,
        // pfx
    },
    http2: false /*, true, {
        allowHTTP1: true,
    } */, 
    json: {
        callbackParam: 'callback',
        parser: JSON.parse,
        // replacer: undefined,
        // space: undefined
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
        overview: false,
        strict: false
    },
    server: {
        // hostname: undefined,
        // backlog: undefined
    },
    servicesRoot: 'services',
    staticFiles: {
        allowDotFiles: false,
        compress: true, // false | TRUE | (req) => boolean use compression if the user-agent allows it, i.e. if accept-encoding header includes gzip, deflate, etc...
        headers: null, // {} || (file) => {},
        directoryBrowsing: false, // '', (directory) => true|false, [ ] paths of the only folders to expose
        indexFile: null, /* 'index.html', false, fn(path, entries[]) */
        lastModified: true,
        maxAge: 0,
        root: 'public',
        virtualPath: 'public'
    },
    subdomainOffset: 2,
    trustProxy: false,
    views: {
        // cache: undefined,
        // defaultEngine: undefined,
        // engines: undefined,
        // resolver: undefined,
        root: 'views'
    },

    get(key, obj) {

        if (!key) {
            return undefined;
        }

        obj = (obj || this);

        const props = key.toString().split('.');
        const propsCount = props.length;

        for (let [index, prop] of props.entries()) {

            if (index == propsCount - 1) {
                return obj[prop];
            } 
            
            if (obj[prop] == null || !(obj[prop] instanceof Object)) {

                return undefined;
            }

            obj = obj[prop];
        }
    },
    
    isEnvironment(env) {

        return this.environment.toLowerCase() == (env || '').toLowerCase();
    },

    mergeRecursive(obj1, obj2) {

        for (const prop of Object.keys(obj2)) {

            try {
                if (obj2[prop].constructor == Object) {
                    obj1[prop] = this.mergeRecursive(obj1[prop], obj2[prop]);
                } else {
                    obj1[prop] = obj2[prop];
                }
            } catch (e) {
                obj1[prop] = obj2[prop];
            }
        }

        return obj1;
    }
});

function httpError(httpStatusCode, hideStack) {

    return function(ctx) {

        ctx.response.statusCode = httpStatusCode;

        const accept = accepts(ctx.request).type(['html', 'json']); 

        if (!hideStack 
            && ctx.config.isEnvironment('development')) {

            switch (accept) {
                case 'html': return renderDebugErrorPage(ctx);
                case 'json': return sendJSONDebugError(ctx);
                default: // CONTINUE
            }
        }

        let contentType;
        let body = http.STATUS_CODES[httpStatusCode];

        switch (accept) {
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

        ctx.response.setHeader('Content-Type', contentType);
        ctx.response.end(body);
    };
}

function renderDebugErrorPage(ctx) {

    const viewsRoot = './node_modules/kikwit/lib/app/views';
    const template = fs.readFileSync(`${viewsRoot}/Debug/error.mustache`, 'utf-8');
    const header = fs.readFileSync(`${viewsRoot}/_header.mustache`, 'utf-8');
    const footer = fs.readFileSync(`${viewsRoot}/_footer.mustache`, 'utf-8');    

    const stack = ctx.error.stack.split(/\s{2,}at\s/i);
    const message = stack.shift();

    let cookies = ctx.headers['cookie'];

    if (cookies) {
        cookies = cookies.split(';').map(x => {
                        const parts = x.split('=');
                        return { name: parts[0], value: parts[1] };
                  });
    }

    const headers = Object.keys(ctx.headers).map(x => ({ name: x, value: ctx.headers[x] }));

    const model = { message, stack, cookies, headers };
    
    const body = mustache.render(template, model, { header, footer });

    ctx.response.setHeader('Content-Type', 'text/html');
    ctx.response.end(body); 
}

function sendJSONDebugError(ctx) {

    const error = {
        message: ctx.error.message,
        stack: ctx.error.stack
    };

    const headers = ctx.headers;
    let cookies = {};

    let cookiesHeader = ctx.headers['cookie'];

    if (cookiesHeader) {
        cookiesHeader.split(';').forEach(x => {
            const parts = x.split('=');

            if (parts[1] == null) {
                parts[1] = '';
            }

            cookies[parts[0]] = parts[1];
        });
    }

    const body = JSON.stringify({ error, cookies, headers });

    ctx.response.setHeader('Content-Type', 'application/json');
    ctx.response.end(body); 
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

        const requestMaxSize = ctx.route.requestMaxSize || ctx.config.requestLimits.maxSize;

        let data = [];
        let dataLength = 0;

        req.on('data', function(chunk) {

            dataLength += chunk.length;

            if (requestMaxSize && (dataLength > requestMaxSize)) {
                data = null;
                return reject(entityTooLargeError());
            }

            data.push(chunk);
        });

        req.on('end', function() {

            const encoding = 'utf8';
            const buffer = Buffer.concat(data);

            const encType = typeIs(req, ['text', 'json']);

            let parsedBody;

            switch (encType) {

                case 'text':

                    parsedBody = buffer.toString(encoding);
                    return resolve(parsedBody);

                case 'json':

                    parsedBody = ctx.config.json.parser(buffer.toString(encoding));
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
        const requestLimits = ctx.config.requestLimits;
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

            const destPath = path.join(os.tmpdir(), (Math.random() * 10e16).toString().slice(0, 16));

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

            fieldsData.push(`${encodeURIComponent(fieldname)}=${encodeURIComponent(val)}`);          
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
            const body = ctx.config.queryParser(str);

            return resolve({ body, files });
        });

        req.pipe(busboy);
    });
}

function entityTooLargeError() {

    const err = Error();

    err.httpStatusCode = 413;

    return err;
}
