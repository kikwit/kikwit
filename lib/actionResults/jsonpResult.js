'use strict';

// TODO Remove .js
import Result from './result.js';

export default class JSONPResult extends Result {

	constructor(ctx, data) {
		super(ctx);

		this.data = data;
	}

	execute() {

		return new Promise((resolve, reject) => {

			if (!this.responseContentTypeSet()) {
				this.trySetContentType('application/javascript');
			}

			const jsonSettings = this.ctx.appSettings.json;
			const dataStr = JSON.stringify(this.data, jsonSettings.replacer, jsonSettings.space);
			const callbackFuncName = this.ctx.query[jsonSettings.callbackParam];
			
			let body;
			
			if (callbackFuncName) {
				body = `${callbackFuncName}(${dataStr})`;
			} else {
				body = dataStr;
			}
				
			this.ctx.response.end(body, () => {
				resolve();
			});
		});
	}
}