'use strict';

import fs from 'fs';
import path from 'path';

import FileResult from './fileResult';
import Result from './result';

const CONTENT_DISPOSITION = 'Content-disposition';

export default class StaticFileResult extends Result {

	constructor(ctx, filePath) {
		super(ctx);	
        
		this.fileResult = new FileResult(ctx, filePath, null, ctx.appSettings.staticFiles);
	}

	execute() {

		return this.fileResult
            .execute();
            // TODO Support index files
            // .catch(err => {
            //     
            //     if (err.code == 'EISDIR'
            //         && this.ctx.staticFiles.index
            //         && this.ctx.staticFiles.index.length) {
            //         
            //         // TODO Support index files
            //     }
            //     
            //     return Promise.reject(err);
            // });
	}
}