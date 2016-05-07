'use strict';

import fs from 'fs';
import path from 'path';

import typeIs from 'type-is';

import FileResult from './fileResult';
import ContentResult from './contentResult';
import JSONResult from './jsonResult';
import Result from './result';

const CONTENT_DISPOSITION = 'Content-disposition';

export default class StaticFileResult extends FileResult {

    constructor(ctx, filePath) {
  
        super(ctx, filePath, null, ctx.config.staticFiles);  
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
                 
                const isRoot = (requestURL == this.options.root
                             || requestURL == ('/' + this.options.root)
                             || requestURL == (this.options.root + '/')
                             || requestURL == ('/' + this.options.root + '/'));
                
                let result;

                switch (typeIs(this.ctx.request, ['json', 'html'])) {
                    
                    case 'html':
                        result = this.getHTMLResult(requestURL, isRoot, files);
                        break;
                        
                    case 'json':
                        result = this.getJSONResult(requestURL, isRoot, files);
                        break;    
                       
                    default:
                        result = this.getTextResult(requestURL, isRoot, files);
                        break;                                       
                }
                           
                result
                    .execute()
                    .then(resolve)
                    .catch(reject);
            }); 
        });
    }

    getHTMLResult(requestURL, isRoot, files) {
        
        let fileLines = files.map(x => `<li><a href="${requestURL}/${x}">${x}</a></li>`)
                             .join('');
                            
        if (!isRoot) {      
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
        
        return new ContentResult(this.ctx, indexTemplateHTML, 'text/html; charset=utf-8')
    } 
        
    getJSONResult(requestURL, isRoot, files) {
        
        if (!isRoot) {
            files.unshift('..');
        }
        
        return new JSONResult(this.ctx, files)
    }  
    
    getTextResult(requestURL, isRoot, files) {
        
        let indexTemplateText = files.join('\r\n');
                            
        if (!isRoot) {      
            indexTemplateText = '..\r\n' + indexTemplateText;
        }
        
        return new ContentResult(this.ctx, indexTemplateText, 'text/plain; charset=utf-8')
    }  
}


