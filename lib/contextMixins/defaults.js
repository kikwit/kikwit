'use strict';

import querystring from 'querystring';

import * as results from '../actionResults';

export default {

	download(path, filename, contentType, options) {
		this.result = new results.DownloadResult(this, path, filename, contentType, options);
		this.resolve();
	},
	
	error(err) {	
		this.result = null;
		this.reject(err);
	},

	send(body, contentType) {
		this.result = new results.ContentResult(this, body, contentType);
		this.resolve();
	},

	sendJSON(body) {
		this.result = new results.JSONResult(this, body);
		this.resolve();
	},

	sendJSONP(data) {
		this.result = new results.JSONPResult(this, data);
		this.resolve();
	},

	sendFile(path, contentType, options) {
		this.result = new results.FileResult(this, path, contentType, options);
		this.resolve();
	},

	redirect(url, statusCode) {
		this.result = new results.RedirectResult(this, url, statusCode);
		this.resolve();
	},

	render(viewPath, locals, contentType) {

		if (viewPath && (typeof viewPath == 'object')) {

			if (arguments.length > 2) {
				throw new TypeError('Wrong Arguments: render([viewPath], [locals], [contentType])');
			}

			if (arguments.length == 2) {

				if (typeof locals != 'string') {
					throw new TypeError('Argument error: [contentType]');
				}

				contentType = locals;
			}

			locals = viewPath;
			viewPath = undefined;
		}

		this.result = new results.ViewResult(this, viewPath, locals, contentType);
		this.resolve();
	},

	routeURL(name, params, query, validate=true) {

		const route = this.routes.find(x => x.actionRoute.name == name);

		if (!route) {
			return undefined;
		}

		let url;

		if (params && route.groupNames && route.groupNames.length) {

			const paramsPatternSource = route.groupNames
											 .map(x => `\`\\s*(${x})\\s*(?:\\s+([^\`]+)\\s*)?\``)
											 .reduce((a, b) => a + '|' + b);

			const pattern = new RegExp(paramsPatternSource, 'g');

			let matchIndex = 0;
			
			url = route.routePath.replace(pattern, (...args) => { 

				let paramName = args[++matchIndex];
				let paramPattern = args[++matchIndex];
				let paramValue = params[paramName];
				
				if (validate 
					&& paramPattern
					&& String(paramValue).search(paramPattern) < 0) {
					
					throw new TypeError(`Invalid route param value: ${paramValue}`);
				}
				
				return params[paramName]; 
			});

		} else {
			url = route.routePath;
		}

		if (query) {

			let formattedQuery = querystring.stringify(query);

			if (!url.endsWith('?')) {
				url += '?';
			}

			url += formattedQuery;
		}

		return url;
	},
}