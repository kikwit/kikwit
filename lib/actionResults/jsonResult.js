'use strict';

// TODO Remove .js
import Result from './result.js';

export default class JSONResult extends Result {

	constructor(ctx, body) {
		super(ctx);

		this.body = body;
	}

	execute() {

		return new Promise((resolve, reject) => {
			
			if (!this.responseContentTypeSet()) {
				this.trySetContentType('application/json');
			}
			
			const jsonSettings = this.ctx.appSettings.json;
			const body = JSON.stringify(this.body, jsonSettings.replacer, jsonSettings.space);

			this.ctx.response.end(body, () => {
				resolve();
			});
		});
	}
}