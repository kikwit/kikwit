'use strict';

import Promise from 'bluebird';

import Result from './result';

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
			
			const jsonSettings = this.ctx.config.json;
			const body = JSON.stringify(this.body, jsonSettings.replacer, jsonSettings.space);

			this.ctx.response.end(body, () => {
				resolve();
			});
		});
	}
}