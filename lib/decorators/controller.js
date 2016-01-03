'use strict';

// TODO Remove .js
import * as config from '../config.js';

export function controller(target) {
	
	if (!target.name || target.name == '_default') {
		throw new Error('Anonymous controllers not supported\r\n', target.toString());	
	}
			
	Object.defineProperty(target, config.controllerTag, {
		enumerable: false,
		writable: false,
		value: true
	});
	
	let actions = getControllerActions(target);
			
	Object.defineProperty(target, config.actionsProp, {
		enumerable: false,
		writable: false,
		value: new Set(actions)
	});
	
	return target;
}

function getControllerActions(target) {
	
	let propKeys = Object.getOwnPropertyNames(target.prototype);
	
	propKeys.splice(propKeys.indexOf('constructor'), 1);
	
	let prop;
	let actions = [];
	
	for (let key of propKeys) {
		
		prop = target.prototype[key];
	
		if (!prop ||  !prop[config.actionTag]) {
			continue;
		}

		actions.push(prop);
	}
	
	return actions;
}