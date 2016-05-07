'use strict';

import cluster from 'cluster';
import events from 'events';
import http from 'http';
import https from 'https';
import os from 'os';

import Promise from 'bluebird';

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

    const { appConfig, routes } = configurer.init();
    const numWorkers = getNumWorkers(appConfig);

    if (numWorkers == 1 || !cluster.isMaster) {
        
        return new Promise((resolve, reject) => {
            
            listen(server, appConfig, routes, (err) => {
              
                if (err) {
                    return reject(err);
                }
   
                server.numWorkers = numWorkers;
                
                process.on('uncaughtException', (err) => {
                    server.emit('uncaughtException', err);
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
            
            if(code !== 0) {
                // TODO Log
                console.log(`worker exited with error code: ${code}`);
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

function listen(server, appConfig, routes, callback) {

    const listener = (request, response) => {
        return dispatcher.dispatch(appConfig, routes, request, response);
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

    const settings = appConfig.server;

    webServer.listen(settings.port, settings.hostname, settings.backlog, (err) => {
        
        if (!err) {
            server.webServer = webServer;
        }
        
        callback(err);
    });
}

