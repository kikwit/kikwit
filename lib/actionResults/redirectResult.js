'use strict';

import Promise from 'bluebird';

import Result from './result';

const LOCATION = 'Location';

export default class RedirectResult extends Result {
	
	constructor(ctx, url, statusCode) {
		super(ctx);
		
		this.url = url;
		this.statusCode = statusCode;
	}
	
	execute() {
		
		return new Promise((resolve, reject) => {
				
			const res = this.ctx.response;
			
			res.statusCode = this.statusCode || 302;
			res.setHeader(LOCATION, this.url);
			
			resolve();
		});
	}
}