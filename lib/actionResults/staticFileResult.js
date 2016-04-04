'use strict';

import fs from 'fs';
import path from 'path';

import FileResult from './fileResult';
import ContentResult from './contentResult';
import Result from './result';

const CONTENT_DISPOSITION = 'Content-disposition';

export default class StaticFileResult extends FileResult {

    constructor(ctx, filePath) {
        super(ctx, filePath, null, ctx.appSettings.staticFiles);
    }

    execute() {

        return super.execute()
            .then(() => {
                return Promise.resolve();
            })
            .catch(err => {

                if (!(err.code == 'EISDIR' 
                      && this.options 
                      && this.options.index)) {
                        
                    return Promise.reject(err);
                }

                switch(typeof(this.options.index)) {
                    
                    case 'string':
                    
                        const indexFile = path.join(this.path, this.options.index);

                        this.setPath(indexFile);

                        return this.execute();
                        
                    case 'boolean':
                        
                        return this.renderIndexFile();
                        
                    default: 
                    
                        return Promise.reject(err);
                }
            });
    }
    
    renderIndexFile() {
        
        return new Promise((resolve, reject) => {
        
            fs.readdir(this.path, (err, files) => {
                
                if (err) {
                    return reject(err);
                }
                
                let requestURL = this.ctx.request.url;
                
                if (requestURL.endsWith('/')) {
                    requestURL = requestURL.slice(0, requestURL.length - 1);
                }
                
                let fileLines = files
                                    .map(x => `<li><a href="${requestURL}/${x}">${x}</a></li>`)
                                    .join('');
                                    
                if (requestURL != this.options.root
                    && requestURL != ('/' + this.options.root)
                    && requestURL != (this.options.root + '/')
                    && requestURL != ('/' + this.options.root + '/')) {  
                        
                    fileLines = '<li><a href="./">..</a></li>' + fileLines;
                }
                
                const indexTemplateHTML = `
                <html>
                    <h2>${requestURL}</h2>
                    <ul>
                        ${fileLines}
                    </ul>
                </html>
                `.replace(/\s+/, '');
                
                new ContentResult(this.ctx, indexTemplateHTML, 'text/html; charset=utf-8')
                        .execute()
                        .then(resolve)
                        .catch(reject);
            }); 
        });
    }  
}


