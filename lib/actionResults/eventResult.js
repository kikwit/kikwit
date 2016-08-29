'use strict';

import Promise from 'bluebird';

import Result from './result';

const TEXT_EVENT_STREAM = 'text/event-stream';
const RETRY = 5000;

export default class EventResult extends Result {

	constructor(ctx, eventDetails, interval) {
		super(ctx);

        this.eventDetails = eventDetails;
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

            if (!this.eventDetails) {
                return this.ctx.response.write(':');
            }

            const eventDetails = this.eventDetails;

            this.ctx.response.write(`retry: ${eventDetails.retry > 0 ? eventDetails.retry : RETRY}\n`);

            if (eventDetails.event != null) {
                this.ctx.response.write(`event: ${ eventDetails.event }\n`);
            }

            if (eventDetails.id != null) {
                this.ctx.response.write(`id: ${ eventDetails.id }\n`);
            }

            if (eventDetails.data != null) {

                let data;

                if (eventDetails.data instanceof Buffer) {

                    data = eventDetails.data.toString();

                } else if (eventDetails.data instanceof Object) {

                    data = JSON.stringify(eventDetails.data);

                } else {
                    
                    data = eventDetails.data;
                }

                this.ctx.response.write(`data: ${ data }\n\n`);
            }

            resolve();         
		});
	}
}
