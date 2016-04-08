'use strict';

import Promise from 'bluebird';

import Result from './result';

export default class StreamResult extends Result {

	constructor(ctx, stream, contentType) {
		super(ctx);

		this.stream = stream;
		this.contentType = contentType;
	}

	execute() {

		if (this.contentType) {
			
			this.trySetContentType(this.contentType);
			
		} else if (!this.responseContentTypeSet()) {

			this.trySetContentType('application/octet-stream');
		}

		return new Promise((resolve, reject) => {
			
            this.stream.on('end', () => {
                resolve();
            });             
            
			this.stream.pipe(this.ctx.response);
		});
	}
}