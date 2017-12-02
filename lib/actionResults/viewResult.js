'use strict';

import path from 'path';

import Promise from 'bluebird';

import Result from './result';

export default class ViewResult extends Result {

	constructor(ctx, viewPath, locals, contentType) {
		super(ctx);

		this.viewPath = viewPath;
		this.locals = (locals || {});
		this.contentType = contentType;
	}

	execute() {

		return new Promise((resolve, reject) => {

			const ctx = {
				actionName: this.ctx.route.actionName,
				config: this.ctx.config,
				controllerBasename: this.ctx.route.controllerBasename,
				pushFiles: this.ctx.pushFiles
			};

			const viewResolver = this.ctx.config.views.resolver;

			const { resolvedPath, viewEngine } = viewResolver.resolvePath(ctx, this.viewPath, this.locals, this.contentType);
            
            this.setUseCache();

			viewResolver
				.renderTemplate(viewEngine, resolvedPath, this.locals)
				.then(content => {

					const response = this.ctx.response;

					if (this.http2Enabled && this.ctx.pushFiles && this.ctx.pushFiles.length) {

						response.stream.respond({
							':status': 200,
							'content-type': 'text/html',
						});

						this.push(this.ctx.pushFiles);

						response.stream.end(content, () => resolve());
						
					} else {

						if (this.contentType) {
							
							this.trySetContentType(this.contentType);
			
						} else if (!this.responseContentTypeSet()) {
			
							this.trySetContentType('text/html');
						}

						response.write(content, () => resolve());
					}
				})
				.catch(reason => {
					reject(reason);
				});
		});
	}
    
    setUseCache() {
        
        if (this.locals.cache != null) {
            return;
        }
        
        let config = this.ctx.config;
        let cacheViews;
        
        if (config.views.cache == undefined) {
            cacheViews = (config.environment == 'production');
        } else {
            cacheViews = !!config.views.cache;
        }
        
        this.locals.cache = cacheViews;   
    }
}
