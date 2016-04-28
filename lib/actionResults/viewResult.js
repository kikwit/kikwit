'use strict';

import path from 'path';

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

			const viewsSettings = this.ctx.appSettings.views;

			const ctx = {
				actionName: this.ctx.route.actionName,
				appSettings: this.ctx.appSettings,
				controllerName: this.ctx.route.Controller.name
			};

			const viewPath = viewsSettings.pathResolver(ctx, this.viewPath, this.locals, this.contentType);

			const viewEngineKey = path.extname(viewPath).slice(1);
			const viewEgine = viewsSettings.engines[viewEngineKey];

			if (!viewEgine) {
				let err = new Error(`View engine not found for [${viewPath}]`);
				return reject(err);
			}
            
            this.setUseCache();

			viewEgine(viewPath, this.locals, (err, html) => {

				if (err) {
					return reject(err);
				}

				const res = this.ctx.response;

				res.write(html, () => {
					return resolve();
				});
			})
		});
	}
    
    setUseCache() {
        
        if (this.locals.cache != null) {
            return;
        }
        
        let appSettings = this.ctx.appSettings;
        let cacheViews;
        
        if (appSettings.views.cache == undefined) {
            cacheViews = (appSettings.environment == 'production');
        } else {
            cacheViews = !!appSettings.views.cache;
        }
        
        this.locals.cache = cacheViews;   
    }
}
