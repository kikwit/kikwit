'use strict';

import Promise from 'bluebird';

import Result from './result';

const TEXT_EVENT_STREAM = 'text/event-stream';
const RETRY = 5000;

export default class EventResult extends Result {

	constructor(ctx, event, interval) {
		super(ctx);

        this.event = event;
        this.interval = interval;        
	}

	execute() {

		return new Promise((resolve, reject) => {

            if (!this.ctx.response.headersSent) {

                this.ctx.request.connection
                    .on('close', () => {
                        this.ctx.connectionClosed = true;
                    });
            }               

            this.trySetContentType(TEXT_EVENT_STREAM);
            this.trySetHeaders({
                'cache-control': 'no-cache',
                'connection': 'keep-alive'
            });

            if (this.ctx.headers.accept != TEXT_EVENT_STREAM) {
                
                var error = new Error();

                error.httpStatusCode = 400; // BAD REQUEST

                return reject(error);
            }

            if (!this.event) {
                return this.ctx.response.write(':');
            }

            const event = this.event;

            this.ctx.response.write(`retry: ${event.retry > 0 ? event.retry : RETRY}\n`);

            if (event.type != null) {
                this.ctx.response.write(`event: ${event.type}\n`);
            }

            if (event.id != null) {
                this.ctx.response.write(`id: ${event.id}\n`);
            }

            if (event.data != null) {

                let data;

                if (event.data instanceof Buffer) {

                    data = event.data.toString();

                } else if (event.data instanceof Object) {

                    data = JSON.stringify(event.data);

                } else {
                    data = event.data;
                }

                this.ctx.response.write(`data: ${data}\n\n`);
            }

            resolve();         
		});
	}
}
