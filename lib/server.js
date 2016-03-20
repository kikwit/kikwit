'use strict';

import cluster from 'cluster';
import http from 'http';
import os from 'os';

import Promise from 'bluebird';
// import stickySession from 'sticky-session';
// import socketIO from 'socket.io';

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
    
    appSettings.port = port;
    
    const hostname = options.hostname;
    const backlog = options.backlog;
    
    const numCPUs = os.cpus().length;
    
    const listener = (request, response) => {
        return dispatcher.dispatch(appSettings, routes, request, response);
    };
    
    /*
    if (!stickySession.listen(server, port, { workers: numCPUs })) {
        
        server.once('listening', function() {
            console.log(`server started on ${port} port`);
        });
        
        return;
    }
    
    var io = socketIO(server);
    
    io.on('connection', function (socket) {
        socket.emit('news', { hello: 'world' });
        socket.on('breaking', function (data) {
            socket.emit('Just in', { breaking: data });
        });
    });  
    */

    if (cluster.isMaster) {

        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }
        
        cluster.on('exit', function(worker, code, signal) {
            // TODO Log code, signal
            cluster.fork();
        });
    } else {
    
        const server = http.createServer(listener);       

        server.listen(port, hostname, backlog); 
    }
}

