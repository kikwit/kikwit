'use strict';

import cluster from 'cluster';
import http from 'http';
import os from 'os';

import * as dispatcher from './dispatcher';
import * as config from './config';

export default {

    start() {

        const { appSettings, routes } = config.init();

        const numCPUs = getNumCPUS(appSettings);

        const listener = (request, response) => {
            return dispatcher.dispatch(appSettings, routes, request, response);
        };

        if (numCPUs == 1) {
            return listen(listener, appSettings, () => {
                // TODO Log
                console.log(`Online, PID: ${process.pid}`);                
            });
        }

        if (cluster.isMaster) {

            for (let i = 0; i < numCPUs; i++) {
                cluster.fork();
            }

            cluster.on('listening', (worker, address) => {
                // TODO Log
                console.log(`Worker online. ID: ${worker.id}, PID: ${worker.process.pid}`);
            });

            cluster.on('exit', function(worker, code, signal) {
                // TODO Log code, signal
                cluster.fork();
            });

        } else {
            listen(listener, appSettings);
        }
    }
}

function getNumCPUS(appSettings) {

    const cpusLength = os.cpus().length;

    switch (typeof(appSettings.cluster)) {
        case 'boolean': return appSettings.cluster ? cpusLength : 1;
        case 'number':
            let val = Number(appSettings.cluster);
            return Math.max(1, Math.min(val, os.cpus().length));
        default: return 1;
    }
}

function listen(listener, appSettings, callback) {

    const server = http.createServer(listener);

    const settings = appSettings.server;

    server.listen(settings.port, settings.hostname, settings.backlog, callback);
}

