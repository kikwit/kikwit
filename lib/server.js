'use strict';

import cluster from 'cluster';
import events from 'events';
import http from 'http';
import https from 'https';
import http2 from 'http2';
import os from 'os';

import { Server as WebSocketServer } from 'ws';

import Promise from 'bluebird';
import proxyAddr from 'proxy-addr';

import * as dispatcher from './dispatcher';
import * as configurer from './configurer';

export class Server extends events.EventEmitter {
    
    configure(configureFunction) {
        
        this.configureFunction = configureFunction;
    }
    
    start() {
        
        return startServer(this)
                    .catch(Promise.reject)
                    .then(() => {
                        return Promise.resolve();
                    });
    }
    
    get isWorker() {
        
        return this.httpServer != null;
    }
}

function startServer(server) {

    const { appConfig, routes, services } = configurer.init(server.configureFunction);
    const numWorkers = getNumWorkers(appConfig);

    if (numWorkers == 1 || !cluster.isMaster) {
        
        return new Promise((resolve, reject) => {
            
            listen(server, appConfig, routes, services, (err) => {
              
                if (err) {
                    return reject(err);
                }
   
                server.numWorkers = numWorkers;
                server.routes = routes;
                server.services = services;

                process.on('unhandledRejection', (err) => {                   
                    server.emit('error', err);
                });

                process.on('uncaughtException', (err) => {                   
                    server.emit('error', err);
                });
                
                return resolve();             
            }); 
        });
    }

    for (var i = 0; i < numWorkers; i++) {
        
        const worker = cluster.fork();

        worker.on('error', (err) => {
           server.emit('error', err); 
        });

        worker.on('exit', (code, signal) => {
            
            if(!worker.suicide) {
                // TODO Log
                cluster.fork();
            }
        });        
    }
    
    return Promise.resolve();
}

function getNumWorkers(appConfig) {

    const cpusLength = os.cpus().length;

    switch (typeof(appConfig.cluster)) {

        case 'boolean': return appConfig.cluster ? cpusLength : 1;
        case 'number':
            let val = appConfig.cluster;
            return Math.max(1, Math.min(val, os.cpus().length));
        case 'string':
            if (/^\d+$/.test(appConfig.cluster.trim())) {
                return Number.parseInt(appConfig.cluster.trim());
            } else if (/^true|false$/i.test(appConfig.cluster.trim())) {
                return appConfig.cluster.trim().toLowerCase() == 'true' ? cpusLength : 1;
            } 
            return 1;
        default: return 1;
    }
}

function getTrustProxy(config) {

    if (typeof config.trustProxy == 'function') {

        return config.trustProxy;
    }

    if (config.trustProxy === true) {

        return () => true;

    } else if (config.trustProxy) {

        if (Number.isInteger(config.trustProxy)) {

            return (addr, i) => i < config.trustProxy;
        }

        return proxyAddr.compile(config.trustProxy);
    }  
}
function createHttpServer(appConfig, routes, services) {
    
    const trustProxy = getTrustProxy(appConfig);
    const listener = (request, response) => dispatcher.dispatch(appConfig, trustProxy, routes, services, request, response);

    if (appConfig.http2) {

        let allowHTTP1 = http2AllowHTTP1(appConfig);
        
        return http2.createServer({ allowHTTP1 }, listener);
    }

    return http.createServer(listener);
}

function createHttpsServer(appConfig, routes, services) {
    
    const trustProxy = getTrustProxy(appConfig);
    const { cert, key, pfx } = appConfig.https;
    const listener = (request, response) => dispatcher.dispatch(appConfig, trustProxy, routes, services, request, response);

    if (appConfig.http2) {

        let allowHTTP1 = http2AllowHTTP1(appConfig);
        
        return http2.createSecureServer({ cert, key, pfx, allowHTTP1 }, listener);
    }
    
    return https.createServer({ cert, key, pfx }, listener);
}

function http2AllowHTTP1(appConfig) {

    if (appConfig.http2 === true) {
       return true;
    }
    
    return !!appConfig.http2.allowHTTP1;
}

function listen(server, appConfig, routes, services, callback) {

    const webServers = [];

    if (appConfig.http) {

        webServers.push({
            webServer: createHttpServer(appConfig, routes, services),
            port: appConfig.http.port
        });
    }

    if (appConfig.https
        && (appConfig.https.pfx || (appConfig.https.key && appConfig.https.cert))) {
        
        webServers.push({
            webServer: createHttpsServer(appConfig, routes, services),
            port: appConfig.https.port
        });
    }

    const settings = appConfig.server;
    const trustProxy = getTrustProxy(appConfig);
    const enableWebSockets = routes.some(x => x.webSocket);

    for (const { webServer, port } of webServers) {

        if (enableWebSockets) {
            initWebSocketServer(webServer, appConfig, routes, services, trustProxy);
        }
    
        webServer.listen(port, settings.hostname, settings.backlog, (err) => {
            
            if (!err) {
                server.webServer = webServer;
            }
            
            // TODO Anything to kill here?

            callback(err);
        });        
    }
}

function initWebSocketServer(webServer, appConfig, routes, services, trustProxy) {

    const webSockerServer = new WebSocketServer({ server: webServer});
    const listener = webSocket => dispatcher.dispatchWebSocket(appConfig, trustProxy, routes, services, webSocket);

    webSockerServer.on('connection', listener);
}

