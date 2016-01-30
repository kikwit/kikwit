'use strict';

import * as config from '../config';

export function consumes(...mimeTypes) {
	
	return function (target, key, descriptor) {

		if (descriptor) {
			return configureAction(mimeTypes, descriptor);
		}	
		
		return configureController(mimeTypes, target);
	}
}

function configureController(mimeTypes, target) {
	
	if (mimeTypes) {		
		Object.defineProperty(target, config.consumesProp, {
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
		Object.defineProperty(action, config.consumesProp, {
			enumerable: false,
			writable: false,
			value: mimeTypes
		});
	}		
	
	return descriptor;
}
