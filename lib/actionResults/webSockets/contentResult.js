'use strict';

import Promise from 'bluebird';

import WebSocketResult from './webSocketResult';

export default class ContentResult extends WebSocketResult {

	constructor(ctx, data, options, callback) {
		super(ctx);

		this.data = data;
		this.options = options;
		this.callback = callback;
	}

	execute() {

		return new Promise((resolve, reject) => {
			
			this.ctx.webSocket.send(this.data, this.options, this.callback, (err) => {

				if (err) {
					return reject(err);
				}

				resolve();
			});
		});
	}
}