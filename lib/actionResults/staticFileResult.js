'use strict';

import fs from 'fs';
import path from 'path';

import accepts from 'accepts';

import FileResult from './fileResult';
import ContentResult from './contentResult';
import JSONResult from './jsonResult';
import Result from './result';

import mustache from 'mustache';

const VIEWS_ROOT = './node_modules/kikwit/lib/app/views';
const CONTENT_DISPOSITION = 'Content-disposition';
const URL_PATH_SEPARATOR = '/';

export default class StaticFileResult extends FileResult {

    constructor(ctx, filePath) {
  
        super(ctx, filePath || URL_PATH_SEPARATOR, null, ctx.config.staticFiles);  
    }

    execute() {

        return super.execute()
            .then(() => {
                return Promise.resolve();
            })
            .catch(err => {
 
                if (err.code != 'EISDIR') {

                    return Promise.reject(err);

                } else if (!this.ctx.config.staticFiles || !this.ctx.config.staticFiles.index) {
                        
                    err.code = 'ENOENT';

                    return Promise.reject(err);
                }

                switch(typeof(this.ctx.config.staticFiles.index)) {
                    
                    case 'string':
                    
                        const indexFile = path.join(this.path, this.ctx.config.staticFiles.index);

                        this.setPath(indexFile);

                        return this.execute();
                        
                    case 'boolean':

                        if (this.ctx.config.staticFiles.index) {
                            return this.renderIndexFile();
                        }
                        
                    default: 
                        
                }
                
                return Promise.reject(err);
            });
    }
    
    renderIndexFile() {

        return new Promise((resolve, reject) => {
            
            fs.readdir(this.path, (err, files) => {

                let statsPromises = this.getStatsPromises(files);
              
                Promise.all(statsPromises).then(stats => {
          
                    if (err) {
                        return reject(err);
                    }
                    
                    let requestURL = this.ctx.request.url;
                    
                    if (!requestURL.endsWith(URL_PATH_SEPARATOR)) {
                        requestURL = requestURL + URL_PATH_SEPARATOR;
                    }
                    
                    const isRoot = (requestURL == this.ctx.config.staticFiles.root
                                || requestURL == (URL_PATH_SEPARATOR + this.ctx.config.staticFiles.root)
                                || requestURL == (this.ctx.config.staticFiles.root + URL_PATH_SEPARATOR)
                                || requestURL == (URL_PATH_SEPARATOR + this.ctx.config.staticFiles.root + URL_PATH_SEPARATOR));
                    
                    let result;

                    switch (accepts(this.ctx.request).type(['json', 'html'])) {
                        
                        case 'html':
                            result = this.getHTMLResult(requestURL, isRoot, stats);
                            break;
                            
                        case 'json':
                            result = this.getJSONResult(requestURL, isRoot, stats);
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
        });
    }

    getHTMLResult(requestURL, isRoot, stats) {
        
        // TODO Cache these templates
        const template = fs.readFileSync(`${VIEWS_ROOT}/staticFilesIndex.mustache`, 'utf-8');
        const header = fs.readFileSync(`${VIEWS_ROOT}/_header.mustache`, 'utf-8');
        const footer = fs.readFileSync(`${VIEWS_ROOT}/_footer.mustache`, 'utf-8');

        const directories = requestURL
                .split(URL_PATH_SEPARATOR)
                .filter(x => x != '' && x != URL_PATH_SEPARATOR);

        const currentDirectory = directories.pop();

        let model = {
            directories,
            currentDirectory,
            isRoot,
            stats
        };

        const output = mustache.render(template, model, { header, footer });

        return new ContentResult(this.ctx, output, 'text/html; charset=utf-8');
    } 
        
    getJSONResult(requestURL, isRoot, stats) {
        
        return new JSONResult(this.ctx, stats)
    }  
    
    getTextResult(requestURL, isRoot, files) {
        
        let indexTemplateText = files.join('\r\n');
                            
        if (!isRoot) {      
            indexTemplateText = '..\r\n' + indexTemplateText;
        }
        
        return new ContentResult(this.ctx, indexTemplateText, 'text/plain; charset=utf-8')
    }  

    getStatsPromises(files) {

        return files.map(x => new Promise((resolve, reject) => {

            fs.stat(path.join(this.path, x), (err, stats) => {

                if (err) {
                    return reject(err);
                }

                stats.fileName = x + (stats.isDirectory() ? URL_PATH_SEPARATOR : '');
                stats.fileURL = path.join(this.ctx.request.url, stats.fileName);
                stats.fileSize = stats.isDirectory() ? '-' : stats.size;
                stats.lastModified = stats.mtime.toISOString().slice(0, 19).replace('T', ' ');

                resolve(stats);
            });
        }));
    }
}

