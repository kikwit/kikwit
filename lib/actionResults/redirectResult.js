'use strict';

import Promise from 'bluebird';

import Result from './result';

const LOCATION = 'Location';

export default class RedirectResult extends Result {
	
	constructor(ctx, url) {
		super(ctx);
		
		this.url = url;
	}
	
	execute() {
		
		return new Promise((resolve, reject) => {
				
			const res = this.ctx.response;
			
			res.setHeader(LOCATION, this.url);
			
			resolve();
		});
	}
}