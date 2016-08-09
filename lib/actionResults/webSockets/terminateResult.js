'use strict';

import Promise from 'bluebird';

import WebSocketResult from './webSocketResult';

export default class TerminateResult extends WebSocketResult {

	constructor(ctx) {
		super(ctx);
	}

	execute() {

		return new Promise((resolve, reject) => {
			
			try {

				this.ctx.webSocket.terminate();

				return resolve();

			} catch (err) {
				reject(err);
			}
			
		});
	}
}