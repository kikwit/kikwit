'use strict';

import * as config from '../config';

export function route(path, name) {
	
	return function (target, key, descriptor) {

		if (descriptor) {
			return configureAction(path, name, descriptor);
		}
		
		return configureController(path, target);
	}
}

function configureController(path, target) {
	
	path = path || target.name;
	
	if (!target.name || target.name == '_default') {
		throw new Error('Anonymous controllers not supported\r\n', target.toString());	
	}
		
	Object.defineProperty(target, config.routeProp, {
		enumerable: false,
		writable: false,
		value: { path }
	});
			
	return target;
}

function configureAction(path, name, descriptor) {
	
	let action = descriptor.value;
	
	path = path || action.name;
	
	if (!path) {
		throw new Error('No value specified for route\r\n', action.toString());	
	}
			
	if (!action[config.actionTag]) {
		Object.defineProperty(action, config.actionTag, {
			enumerable: false,
			writable: false,
			value: true
		});
	}
	
	Object.defineProperty(action, config.routeProp, {
		enumerable: false,
		writable: false,
		value: { path, name }
	});
			
	return descriptor;
}
