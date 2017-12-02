'use strict';

import fs from 'fs';
import path from 'path';

const CONTENT_TYPE = 'Content-Type';
const IF_MODIFIED_SINCE = 'If-Modified-Since';
const URL_PATH_SEPARATOR = '/';

export default class Result {

	constructor(ctx) {
		this.ctx = ctx;
		this.http2Enabled = this.ctx.config.http2 && this.ctx.request.httpVersion == '2.0';
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
	
	push(files) {

		let publicFolder = this.ctx.config.staticFiles.root.trim();

		if (!publicFolder.startsWith(URL_PATH_SEPARATOR)) {
			publicFolder = URL_PATH_SEPARATOR + publicFolder;
		}

		if (!publicFolder.endsWith(URL_PATH_SEPARATOR)) {
			publicFolder = publicFolder + URL_PATH_SEPARATOR;
		}		

		for (const file of files) {

			this.ctx.response.stream.pushStream({ ':path': publicFolder + file.path.replace('\\', '/') }, (pushStream) => {

				pushStream.respondWithFile(
					path.join(this.ctx.config.applicationRoot, publicFolder, file.path),
					file.headers
				);
			});			
		}		
	}		

	run() {
		
		this.preExecute();
		
		return this.execute();
	}
	
	preExecute() {}

	execute() { }
}