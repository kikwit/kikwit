'use strict';

import cluster from 'cluster';
import events from 'events';
import http from 'http';
import https from 'https';
import os from 'os';

import { Server as WebSocketServer } from 'ws';

import Promise from 'bluebird';
import proxyAddr from 'proxy-addr';

import * as dispatcher from './dispatcher';
import * as configurer from './configurer';

export class Server extends events.EventEmitter {
    
    init(initFunction) {
        
        this.initFunction = initFunction;
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

    const { appConfig, routes, services } = configurer.init();
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
            let val = Number(appConfig.cluster);
            return Math.max(1, Math.min(val, os.cpus().length));
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

function listen(server, appConfig, routes, services, callback) {

    const trustProxy = getTrustProxy(appConfig);

    const listener = (request, response) => {
        return dispatcher.dispatch(appConfig, trustProxy, routes, services, request, response);
    };

    let webServer;
    
    if (appConfig.https
        && (appConfig.https.pfx
            || (appConfig.https.key && appConfig.https.cert))) {
                
        webServer = https.createServer(appConfig.https, listener);            
    } else {
        webServer = http.createServer(listener);
    }
    
    if (server.initFunction) {
        initFunction(webServer);
    }

    if (routes.some(x => x.webSocket)) {
        initWebSocketServer(webServer, appConfig, routes, services, trustProxy);
    }

    const settings = appConfig.server;

    webServer.listen(settings.port, settings.hostname, settings.backlog, (err) => {
        
        if (!err) {
            server.webServer = webServer;
        }
        
        callback(err);
    });
}

function initWebSocketServer(webServer, appConfig, routes, services, trustProxy) {

    const webSockerServer = new WebSocketServer({ server: webServer});

    webSockerServer.on('connection', (webSocket) => {

        dispatcher.dispatchWebSocket(appConfig, trustProxy, routes, services, webSocket);
    });
}

