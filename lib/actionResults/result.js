'use strict';

const CONTENT_TYPE = 'Content-Type';
const IF_MODIFIED_SINCE = 'If-Modified-Since';

export default class Result {

	constructor(ctx) {
		this.ctx = ctx;
	}

	responseHeader(name) {

		const res = this.ctx.response;

		if (res.headersSent) {
			return null;
		}

		return res.getHeader(name);
	}

	headerSet(name) {
		return !!this.responseHeader(name);
	}

	responseContentTypeSet() {
		return this.headerSet(CONTENT_TYPE);
	}

	trySetHeaders(headers) {

		if (!headers) {
			return false;
		}

		Object.keys(headers).forEach(name => {
			this.trySetHeader(name, headers[name]);
		});
	}

	trySetHeader(name, value) {

		const res = this.ctx.response;

		if (res.headersSent) {
			return false;
		}

		res.setHeader(name, String(value));
		return true;
	}

	trySetContentType(value) {
		return this.trySetHeader(CONTENT_TYPE, value);
	}

	timesMatch(modifiedTime, referenceTimeStr) {

		try {
			if (referenceTimeStr) {

				const referenceTime = new Date(referenceTimeStr);
				const referenceTimeSecs = Math.trunc(referenceTime.getTime() / 1000);
				
				const modifiedTimeSecs = Math.trunc(modifiedTime.getTime() / 1000);
				
				return (referenceTimeSecs == modifiedTimeSecs);
			}

		} catch (ex) {
			// IGNORE
		}

		return false;
	}
	
	run() {
		
		this.preExecute();
		
		return this.execute();
	}
	
	preExecute() {}

	execute() { }
}