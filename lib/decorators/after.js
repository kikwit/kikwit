'use strict';

import * as config from '../config';

const duplicateAfterErrorMessage = 'Only one @after decorator allowed.';

export function after(...handlers) {
		
	return function (target, key, descriptor) {

		if (descriptor) {
			return configureAction(handlers, descriptor);
		}
		
		return configureController(handlers, target);
	}
}

function configureController(handlers, target) {
	
	Object.defineProperty(target, config.afterProp, {
		enumerable: false,
		writable: false,
		value: [ ...handlers, ...(target[config.afterProp] || [])]
	});
			
	return target;
}

function configureAction(handlers, descriptor) {
	
	if (descriptor[config.afterProp]) {
		
		throw new Error(duplicateAfterErrorMessage);
	}
	
	let action = descriptor.value;
		
	Object.defineProperty(action, config.afterProp, {
		enumerable: false,
		writable: false,
		value: handlers
	});
			
	return descriptor;
}
