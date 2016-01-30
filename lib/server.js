'use strict';

import cluster from 'cluster';
import http from 'http';
import os from 'os';

import Promise from 'bluebird';

import * as dispatcher from './dispatcher';
import * as config from './config';

export default {
    start(options, settings) {

        const { appSettings, routes } = config.init(settings);

        return startServer(options, appSettings, routes);
    }
}

function startServer(options, appSettings, routes) {
    
    options = options || {};
    
    const port = options.port
        || process.env.PORT
        || (appSettings.environment.toLowerCase() == 'production' ? 80 : 3000);
        
    const hostname = options.hostname;
    const backlog = options.backlog;
    
    const numCPUs = os.cpus().length;
    
    if (cluster.isMaster) {

        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }
        
        cluster.on('exit', function(worker, code, signal) {
            cluster.fork();
        });
    } else {
       
        const listener = (request, response) => {
            return dispatcher.dispatch(appSettings, routes, request, response);
        };
        
        const server = http.createServer(listener);

        server.listen(port, hostname, backlog); 
    }
}

