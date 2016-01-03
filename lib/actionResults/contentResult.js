'use strict';

// TODO Remove .js
import Result from './result.js';

export default class ContentResult extends Result {

	constructor(ctx, body, contentType) {
		super(ctx);

		this.body = body;
		this.contentType = contentType;
	}

	execute() {

		if (this.contentType) {
			
			this.trySetContentType(this.contentType);
			
		} else if (!this.responseContentTypeSet()) {

			this.trySetContentType('text/plain');
		}

		return new Promise((resolve, reject) => {
			
			this.ctx.response.end(String(this.body), () => {
				resolve();
			});
		});
	}
}