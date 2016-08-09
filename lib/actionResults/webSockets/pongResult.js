'use strict';

import Promise from 'bluebird';

import WebSocketResult from './webSocketResult';

export default class PongResult extends WebSocketResult {

	constructor(ctx, data, options, dontFailWhenClosed) {
		super(ctx);

		this.data = data;
		this.options = options;
		this.dontFailWhenClosed = dontFailWhenClosed;
	}

	execute() {

		return new Promise((resolve, reject) => {
			
			try {

				this.ctx.webSocket.pong(this.data, this.options, this.dontFailWhenClosed);

				return resolve();

			} catch (err) {
				reject(err);
			}
			
		});
	}
}