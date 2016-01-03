'use strict';

import path from 'path';

import Result from './result';

export default class ViewResult extends Result {

	constructor(ctx, viewPath, locals, contentType) {
		super(ctx);

		this.viewPath = viewPath;
		this.locals = locals;
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
				actionName: this.ctx.actionName,
				appSettings: this.ctx.appSettings,
				controllerName: this.ctx.controllerName
			};

			const viewPath = viewsSettings.pathResolver(ctx, this.viewPath, this.locals, this.contentType);

			const viewEngineKey = path.extname(viewPath).slice(1);
			const viewEgine = viewsSettings.engines[viewEngineKey];

			if (!viewEgine) {
				let err = new TypeError(`View engine not found for [${viewPath}]`);
				return reject(err);
			}

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
}