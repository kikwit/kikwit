'use strict';

import Promise from 'bluebird';

import WebSocketResult from './webSocketResult';

export default class ResumeResult extends WebSocketResult {

	constructor(ctx) {
		super(ctx);
	}

	execute() {

		return new Promise((resolve, reject) => {
			
			try {

				this.ctx.webSocket.resume();

				return resolve();

			} catch (err) {
				reject(err);
			}
			
		});
	}
}
