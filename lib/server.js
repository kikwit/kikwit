'use strict';

import http from 'http';

import * as dispatcher from './dispatcher';
import * as config from './config';

export default {
    start(options, settings) {

        const { appSettings, routes } = config.init(settings);

        return startServer(options, appSettings, routes);
    }
}

function startServer(options, appSettings, routes) {

    return new Promise((resolve, reject) => {
        
        options = options || {};

        const listener = (request, response) => dispatcher.dispatch(appSettings, routes, request, response);
        const server = http.createServer(listener);

        const port = options.port
            || process.env.PORT
            || (appSettings.environment.toLowerCase() == 'production' ? 80 : 3000);

        server.listen(port, options.hostname, options.backlog, () => {

            console.log('listening ...');
            console.log();
            console.log('Port:', port);
            console.log('Process Id:', process.pid);

            // process.on('uncaughtException', (err) => {
            // 	if (!err.rejected) {
            // 		console.log(err.stack);
            // 	}
            // });

            resolve(server);
        });
    });
}
