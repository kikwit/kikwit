'use strict';

// TODO Remove .js
import * as config from '../config.js';

export function produces(...mimeTypes) {
	
	return function (target, key, descriptor) {

		if (descriptor) {
			return configureAction(mimeTypes, descriptor);
		}
		
		return configureController(mimeTypes, target);
	}
}

function configureController(mimeTypes, target) {
	
	if (mimeTypes) {		
		Object.defineProperty(target, config.producesProp, {
			enumerable: false,
			writable: false,
			value: mimeTypes
		});
	}
			
	return target;
}

function configureAction(mimeTypes, descriptor) {
	
	if (mimeTypes) {	
		let action = descriptor.value;	
		Object.defineProperty(action, config.producesProp, {
			enumerable: false,
			writable: false,
			value: mimeTypes
		});
	}
			
	return descriptor;
}
