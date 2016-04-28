'use strict';

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

import accepts from 'accepts';
import mimeTypes from 'mime-types';
import Promise from 'bluebird';

import Result from './result';

const ACCEPT_RANGES = 'Accept-Ranges';
const CACHE_CONTROL = 'Cache-Control';
const CONNECTION = 'Connection';
const CONTENT_ENCODING = 'Content-Encoding';
// const CONTENT_LENGTH = 'Content-Length';
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
  
        this.options = options || {}; // { root: __dirname, allowDotFiles: true | FALSE, headers: {} || (path) => {}, lastModified: TRUE | false, maxAge: 0 }
        this.contentType = contentType;
		this.setPath(this.getFilePath(filePath));
	}
    
    setPath(filePath) {
        this.path = filePath;
    }

	execute() {

		return new Promise((resolve, reject) => {

			if (this.options.allowDotFiles !== true && this.path.includes('/.')) {
                				
				const err = new Error('Dot files not allowed.');
				return reject(err);
			}
	
			fs.stat(this.path, (err, stats) => {

				if (err) {
					return reject(err);
				}
				
				if (stats.isDirectory()) {
                    
					err = new Error(`[${this.path}] is a directory`);
                    
                    err.code = 'EISDIR';
                    
					return reject(err);
                    
				} else if (!stats.isFile()) {
                    
					err = new Error(`[${this.path}] is not a file`);
                    
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
                // 
                // let contentLength;
                // 
                // if (ranges && ranges.length == 1) {
                //     contentLength = ranges[0].end - ranges[0].start + 1;                 
                // } else if (!ranges || !ranges.length) {
                //     contentLength = stats.size;
                // }
                // 
                // if (contentLength) {
                //     this.trySetHeader(CONTENT_LENGTH, contentLength);
                // }
                
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
					contentType = mimeTypes.contentType(path.extname(this.path)) || 'application/octet-stream';
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
                    return this.sendMultiRangeResponse(this.path, stats.size, contentType, ranges, boundary, resolve, reject);
                }
                       
                let streamOptions;
                
                if (ranges && ranges.length) {
                    streamOptions = ranges[0];
                }
				
				this.ctx.response.on('finish', () => {
					return resolve();
				});
                
                return this.sendResponse(this.path, streamOptions);
			});
		});
	}
    
    getFilePath(filePath) {

        let fPath = filePath;
   
        const root = this.options.root;
   
        if (root && root.trim()) {
            fPath = path.join(root, fPath);
        }
 
        if (!path.isAbsolute(fPath)) {
            fPath = path.join(this.ctx.appSettings.applicationRoot, fPath);
        }  
      
        return fPath;
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
    
    sendResponse(filePath, streamOptions) {
        
        const fsStream = fs.createReadStream(filePath, streamOptions);

        let compress;
        
        if (typeof this.options.compress == 'function') {
            compress = this.options.compress(filePath);
        } else {
            compress = this.options.compress;
        }
        
        if(compress) {
            
            let contentEncoding = accepts(this.ctx.request).encoding(['gzip', 'x-gzip', 'deflate']);
            
            if (contentEncoding) {
                
                this.trySetHeader(CONTENT_ENCODING, contentEncoding);   
                
                switch(contentEncoding) {
                    case 'gzip':
                    case 'x-gzip':
                        let gzip = zlib.createGzip();
                        return fsStream.pipe(gzip).pipe(this.ctx.response);
                        
                    case 'deflate':
                        let deflate = zlib.createDeflate();
                        return fsStream.pipe(deflate).pipe(this.ctx.response);
                }
            }
        }
        
        fsStream.pipe(this.ctx.response);
    }
}

