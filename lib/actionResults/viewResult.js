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

			if (this.contentType) {

				this.trySetContentType(this.contentType);

			} else if (!this.responseContentTypeSet()) {

				this.trySetContentType('text/html');
			}

			const ctx = {
				actionName: this.ctx.route.actionName,
				config: this.ctx.config,
				controllerBasename: this.ctx.route.controllerBasename
			};

			const viewResolver = this.ctx.config.views.resolver;

			const { resolvedPath, viewEngine } = viewResolver.resolvePath(ctx, this.viewPath, this.locals, this.contentType);
            
            this.setUseCache();

			viewResolver
				.renderTemplate(viewEngine, resolvedPath, this.locals)
				.then(content => {

					this.ctx.response.write(content, () => {
						return resolve();
					});					
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
