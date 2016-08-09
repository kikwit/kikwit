'use strict';

import Promise from 'bluebird';

import WebSocketResult from './webSocketResult';

export default class CloseResult extends WebSocketResult {

	constructor(ctx, code, data) {
		super(ctx);

		this.code = code;
		this.data = data;
	}

	execute() {

		return new Promise((resolve, reject) => {
			
			try {

				this.ctx.webSocket.close(this.code, this.data);

				return resolve();

			} catch (err) {
				reject(err);
			}
			
		});
	}
}