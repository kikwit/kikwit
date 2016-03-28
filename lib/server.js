'use strict';

import cluster from 'cluster';
import events from 'events';
import http from 'http';
import os from 'os';

import Promise from 'bluebird';

import * as dispatcher from './dispatcher';
import * as config from './config';

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

    const { appSettings, routes } = config.init();
    const numWorkers = getNumWorkers(appSettings);

    if (numWorkers == 1 || !cluster.isMaster) {
        
        return new Promise((resolve, reject) => {
            
            listen(server, appSettings, routes, (err) => {
                
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

function getNumWorkers(appSettings) {

    const cpusLength = os.cpus().length;

    switch (typeof(appSettings.cluster)) {
        case 'boolean': return appSettings.cluster ? cpusLength : 1;
        case 'number':
            let val = Number(appSettings.cluster);
            return Math.max(1, Math.min(val, os.cpus().length));
        default: return 1;
    }
}

function listen(server, appSettings, routes, callback) {

    const listener = (request, response) => {
        return dispatcher.dispatch(appSettings, routes, request, response);
    };

    const httpServer = http.createServer(listener);
    
    if (server.initFunction) {
        initFunction(httpServer);
    }

    const settings = appSettings.server;

    httpServer.listen(settings.port, settings.hostname, settings.backlog, (err) => {
        
        if (!err) {
            server.httpServer = httpServer;
        }
        
        callback(err);
    });
}

