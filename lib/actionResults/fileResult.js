'use strict';

import fs from 'fs';
import path from 'path';

import mimeTypes from 'mime-types';

import Result from './result';

const ACCEPT_RANGES = 'Accept-Ranges';
const CACHE_CONTROL = 'Cache-Control';
const CONNECTION = 'Connection';
const CONTENT_LENGTH = 'Content-Length';
const CONTENT_RANGE = 'Content-Range';
const CONTENT_TYPE = 'Content-Type';
const IF_MODIFIED_SINCE = 'If-Modified-Since';
const IF_RANGE = 'If-Range';
const IF_UNMODIFIED_SINCE = 'If-Unmodified-Since';
const LAST_MODIFIED = 'Last-Modified';
const RANGE = 'Range';

export default class FileResult extends Result {

	constructor(ctx, filePath, contentType, options) {
		super(ctx);

		this.path = filePath;
		this.contentType = contentType;
		this.options = options || {}; // { root: __dirname, allowDotFiles: true | FALSE, headers: {} || (path) => {}, lastModified: TRUE | false, maxAge: 0 }
	}

	execute() {

		return new Promise((resolve, reject) => {

			if (this.options.allowDotFiles !== true && this.path.includes('/.')) {				
				const err = new TypeError('Dot files not allowed.');
				return reject(err);
			}
	
			const root = this.options.root;
			let filePath = this.path;
			
			if (root && root.trim()) {
				filePath = path.join(root, filePath);
			}
			
			if (!path.isAbsolute(filePath)) {
				const err = new TypeError(`[${filePath}] is not an absolute path`);
				return reject(err);
			}

			fs.stat(filePath, (err, stats) => {

				if (err) {
					return reject(err);
				}
				
				if (stats.isDirectory()) {
                    
					err = new TypeError(`[${filePath}] is a directory`);
                    
                    err.code = 'EISDIR';
                    
					return reject(err);
                    
				} else if (!stats.isFile()) {
                    
					err = new TypeError(`[${filePath}] is not a file`);
                    
                    err.code = 'ENOENT';
                    
					return reject(err);   
                }
                
                const ifModifiedSinceTimeStr = this.ctx.request.headers[IF_MODIFIED_SINCE.toLowerCase()];

				if (ifModifiedSinceTimeStr && this.timesMatch(stats.mtime, ifModifiedSinceTimeStr)) {
					
					this.setLastModified(stats.mtime);
					this.ctx.response.statusCode = 304;
	
					return this.ctx.response.end(() => {
						return resolve();
					});			
				}
                
                const ifUnmodifiedSinceTimeStr = this.ctx.request.headers[IF_UNMODIFIED_SINCE.toLowerCase()];
                
                if (ifUnmodifiedSinceTimeStr && !this.timesMatch(stats.mtime, ifUnmodifiedSinceTimeStr)) {
					
					this.ctx.response.statusCode = 412;
	
					return this.ctx.response.end(() => {
						return resolve();
					});			
				}

                const rangesStr = this.ctx.request.headers[RANGE.toLowerCase()];               
                let ranges;

                if (rangesStr && rangesStr.trim() && this.ctx.request.method.toUpperCase() == 'GET') {
                    
                    ranges = this.parseRanges(rangesStr, stats.size);   
               
                    const validRanges = (ranges !== null);
                    const ifRangeStr = this.ctx.request.headers[IF_RANGE.toLowerCase()];
                    
                    if (ifRangeStr && ifRangeStr.trim() && (!validRanges || !this.timesMatch(stats.mtime, ifRangeStr))) {      
                                      
                        ranges = undefined;
                        
                    } else if (!validRanges) {
                       
                        this.ctx.response.statusCode = 416;
                        this.trySetHeader(CONTENT_RANGE, `bytes */${stats.size}`);
                        
                        return this.ctx.response.end(() => {
                            return resolve();
                        });	
                    }   
                }
				
				this.trySetHeader(CACHE_CONTROL, `private, max-age=${this.options.maxAge || 0}`);
				
				if (this.options.lastModified !== false) {
					this.setLastModified(stats.mtime);
				}
				
				if (this.options.headers) {
                    
                    let headers;
                    
                    switch(typeof this.options.headers) {
                        
                        case 'object':
                            headers = this.options.headers;
                            break;
                            
                        case 'function':
                            headers = this.options.headers(this.path);
                            break;    
                    }
                    
                    if (headers) {
                        this.trySetHeaders(headers);   
                    }
				}
                
                let contentLength;
                
                if (ranges && ranges.length) {
                    
                    if (ranges.length == 1) {
                        contentLength = ranges[0].end - ranges[0].start + 1;
                    } else {
                        // contentLength = ranges.reduce((total, x) => total + x.end - x.start + 1 , 0);
                    }                   
                } else {
                    contentLength = stats.size;
                }
                
                if (contentLength) {
                    this.trySetHeader(CONTENT_LENGTH, contentLength);
                }
                
                this.trySetHeader(ACCEPT_RANGES, 'bytes');
                                
                if (ranges && ranges.length) {             
                    this.ctx.response.statusCode = 206;
                } else {
                    this.ctx.response.statusCode = 200;
                }
                
                let contentType;
                
				if (this.contentType) {
					contentType = this.contentType;		
				} else if(!this.responseContentTypeSet()) {
					contentType = mimeTypes.contentType(path.extname(filePath)) || 'application/octet-stream';
				}
                
                let boundary;
                
                if (ranges && ranges.length > 1) {
                    boundary = '4b9e42cd78baa9';                    
                    this.trySetContentType(`multipart/byteranges; boundary=${boundary}`);
                } else {
                    contentType && this.trySetContentType(contentType); 
                }
                
                if (ranges && ranges.length == 1) {  
                    this.trySetHeader(CONTENT_RANGE, `bytes ${ranges[0].start}-${ranges[0].end}/${stats.size}`);
                }
                
                if (this.ctx.request.method.toLowerCase() == 'head') {
                    
                    this.trySetHeader(CONNECTION, 'Close');
                    this.ctx.response.end();       
                    
                    return resolve();
                }               
                
                if (ranges && ranges.length > 1) {
                                                                               
                    return this.sendMultiRangeResponse(
                                    filePath, 
                                    stats.size,
                                    contentType, 
                                    ranges, 
                                    boundary,
                                    resolve, 
                                    reject);
                }
                       
                let streamOptions;
                
                if (ranges && ranges.length) {
                    streamOptions = ranges[0];
                }
				
				let fsStream = fs.createReadStream(filePath, streamOptions);

				fsStream.on('close', () => {
					return resolve();
				});

				fsStream.pipe(this.ctx.response);
			});
		});
	}
	
	setLastModified(mtime) {
		
		const lastModified = this.options.lastModified;
		
		let modifiedDate;
		
		if (lastModified && lastModified instanceof Date) {
			modifiedDate = lastModified.toUTCString();
		} else {
			modifiedDate = mtime.toUTCString();
		}
		
		this.trySetHeader(LAST_MODIFIED, modifiedDate);	
	}

     parseRanges(rangesStr, size) {
        
        if(!rangesStr || !(rangesStr = rangesStr.trim())) {
            return;
        }
        
        rangesStr = rangesStr.replace(/^\s*bytes\s*=\s*/, '');
        
        if (!rangesStr) {
            return;
        }

        const rangesItems = rangesStr.split(',');
        const ranges = [];
       
        const regex = /^(\d*)\s*-\s*(\d*)$/;    
        let match, range;
        
        for (let item of rangesItems) {
            
            match = regex.exec(item.trim());
            
            if (!match) {
                return;
            }
            
            range = { 
                start: Number.parseInt(match[1]), 
                end: Number.parseInt(match[2]) 
            };
            
            if (Number.isNaN(range.start) && Number.isNaN(range.end)) {
                return;
            }

            if (Number.isNaN(range.end) || range.end >= size) {
                range.end = size - 1;
            }
             
            if (Number.isNaN(range.start)) {     
                range.start = size - range.end;
                range.end = size - 1;
            }
            
            if (range.start < 0 || range.start > range.end) {
                return null;
            }
            
            ranges.push(range);
        }
                        
        return ranges;
     }
     
    sendMultiRangeResponse(filePath, fileSize, contentType, ranges, boundary, resolveFn, rejectFn) {

        let fsStream, pipeOptions, range;
        
        const EOL = '\r\n';
        const response = this.ctx.response;
        
        const rangePartFn = (idx) => {
 
            let promise = new Promise((resolve, reject) => {

                try {
                        
                    range = ranges[idx];

                    pipeOptions = { end: false };
                    
                    fsStream = fs.createReadStream(filePath, range);    
                    
                    fsStream.on('close', () => {
                        resolve();
                    });  
                    
                    response.write(`${EOL}--${boundary}${EOL}`);
                    response.write(`${CONTENT_TYPE}: ${contentType}${EOL}`);
                    response.write(`${CONTENT_RANGE}: bytes ${range.start}-${range.end}/${fileSize}${EOL}${EOL}`);

                    fsStream.pipe(response, pipeOptions); 
                                            
                } catch (ex) {
                    return reject(ex);
                }
            });
            
            return promise.then(() => {

                if (idx < ranges.length - 1) {
                    return rangePartFn(++idx);
                }
                
                response.end(`${EOL}--${boundary}--${EOL}`);

                return resolveFn();

            }).catch(err => {
                return rejectFn(err);
            });
        }

        return rangePartFn(0);
    }
}

