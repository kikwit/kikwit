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
    https: undefined, // options object passed to https.createServer(...)
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
        overview: false,
        strict: false
    },
    server: {
        port: 3000,
        hostname: undefined,
        backlog: undefined
    },
    servicesRoot: 'services',
    staticFiles: {
        allowDotFiles: false,
        compress: true, // false | TRUE | (req) => boolean use compression if the user-agent allows it, i.e. if accept-encoding header includes gzip, deflate, etc...
        headers: (path) => { }, // {} || (path) => {}
        index: 'index.html', /* 'index.html', false */
        lastModified: true,
        maxAge: 0,
        root: 'public'
    },
    subdomainOffset: 2,
    trustProxy: false,
    views: {
        cache: undefined,
        defaultEngine: undefined,
        engines: undefined,
        resolver: undefined,
        root: 'views'
    },

    isEnvironment(env) {

        return this.environment.toLowerCase() == (env || '').toLowerCase();
    },

    addFromService(key) {

        let service;

        try {

            service = this.resolveService(key);

            if (!service) {
                return this;
            }

        } catch (err) {
            console.warn(`Coud not resolve service [${key}]`);
            return this;
        }

        if (!service.configuration || (typeof service.configuration) != 'object') {
            return this;
        }

        return this.mergeRecursive(this, service.configuration);
    },

    addUserConfig() {

        const applicationId = process.env.npm_package_config_applicationId;

        if (!applicationId || !applicationId.trim()) {
            throw new Error('Required [applicationId] config key not specified in package.json file.');
        }

        const filePath = getUserConfigFilePath(applicationId, this.environment);

        let fileContent;

        try {
            fileContent = fs.readFileSync(filePath, 'utf-8');
        } catch (err) {
            // TODO log err
            return this;
        }
        

        if (!fileContent || !fileContent.trim()) {
            return this;
        }

        const data = JSON.parse(fileContent);

        return this.mergeRecursive(this, data);        
    },

    addEnvironmentVariables(prefix) {

        let variablesMap = getEnvironmentVariables(prefix);

        let data = {};

        for (let key of Object.keys(variablesMap)) {

            setObjectProperty(data, key, variablesMap[key]);
        }

        return this.mergeRecursive(this, data); 
    },

    mergeRecursive(obj1, obj2) {

        for (var prop of Object.keys(obj2)) {

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

function getUserConfigFilePath(applicationId, environment) {

    let filePath;

    if (os.platform() == 'win32') {
        filePath = path.join(process.env.APPDATA, 'kikwit');
    } else {
        filePath = path.join(process.env.HOME, '.kikwit');
    }

    filePath = path.join(filePath, 'config', environment, applicationId, 'user-config.json');

    try {

        fs.accessSync(filePath);

        return filePath;

    } catch (err) {

        if (err.code == 'ENOENT') {
            return null;
        }

        throw new Error('Error accessing user config file:', err.message);
    }
}

function getEnvironmentVariables(prefix) {

    if (prefix) {

        prefix = prefix.trim().toLowerCase();

        if (prefix) {

            const variableMap = {};
            let variable;

            for (let key of Object.keys(process.env)) {

                if (key.toLowerCase().startsWith(prefix)) {
                    
                    variable = key.slice(prefix.length);

                    variableMap[variable] = process.env[key];
                }
            }

            return variableMap;
        }
    }

    return process.env;
}

function setObjectProperty(obj, key, value) {

    const props = key.split('__');
    const propsCount = props.length;

    for (let [index, prop] of props.entries()) {

        if (index == propsCount - 1) {

            obj[prop] = value;
            break;
        } 
        
        if (obj[prop] == null || !(obj[prop] instanceof Object)) {

            obj[prop] = {};
        }

        obj = obj[prop];
    };
}

function httpError(httpStatusCode, hideStack) {

    return function(ctx) {

        let contentType;
        let body;

        if (!hideStack && ctx.config.environment.toLowerCase() == 'development') {
            body = ctx.error.stack;
        }

        if (!body || !body.trim()) {
            body = http.STATUS_CODES[httpStatusCode];
        }

        const accept = accepts(ctx.request).type(['html', 'json']);

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

        const requestMaxSize = ctx.config.requestLimits.maxSize;

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
