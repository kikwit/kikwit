'use strict';

import Promise from 'bluebird';

import WebSocketResult from './webSocketResult';

export default class PauseResult extends WebSocketResult {

	constructor(ctx) {
		super(ctx);
	}

	execute() {

		return new Promise((resolve, reject) => {
			
			try {

				this.ctx.webSocket.pause();

				return resolve();

			} catch (err) {
				reject(err);
			}
			
		});
	}
}