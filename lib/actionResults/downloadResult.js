'use strict';

import fs from 'fs';
import path from 'path';

import FileResult from './fileResult';
import Result from './result';

const CONTENT_DISPOSITION = 'Content-disposition';

export default class DownloadResult extends Result {

	constructor(ctx, filePath, filename, contentType, options) {
		super(ctx);
		
		this.filename = filename;
		
		options = options || {};
		options.lastModified = options.lastModified || false;		
	
		this.fileResult = new FileResult(ctx, filePath, contentType, options);
	}

	execute() {

		let filename = this.filename || path.basename(this.fileResult.path);

		this.trySetHeader(CONTENT_DISPOSITION, `attachment; filename=${ filename }`);
		
		return this.fileResult.execute();
	}
}