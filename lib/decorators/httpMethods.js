'use strict';

import * as config from '../config';

export function all(target, key, descriptor) {	
	
	if (descriptor) {

		delete descriptor.value[config.httpMethodsProp];
		
		descriptor = configureHttpMethod(null, descriptor, 'all');
		
		Object.freeze(descriptor.value[config.httpMethodsProp]);
		
		return descriptor;		
	}
	
	delete target[config.httpMethodsProp];
	
	target = configureHttpMethod(target, null, 'all');
	
	Object.freeze(target[config.httpMethodsProp]);
	
	return target;		

}

export function get(target, key, descriptor) {		
	return configureHttpMethod(target, descriptor, 'get');
}

export function post(target, key, descriptor) {		
	return configureHttpMethod(target, descriptor, 'post');
}

export function put(target, key, descriptor) {		
	return configureHttpMethod(target, descriptor, 'put');
}

export function del(target, key, descriptor) {		
	return configureHttpMethod(target, descriptor, 'del');
}

export function head(target, key, descriptor) {		
	return configureHttpMethod(target, descriptor, 'head');
}

export function options(target, key, descriptor) {		
	return configureHttpMethod(target, descriptor, 'options');
}

function configureHttpMethod(target, descriptor, httpMethod) {

	if (descriptor) {
		return configureActionHttpMethod(descriptor, httpMethod);
	}
	
	return configureControllerHttpMethod(target, httpMethod);	
}

function configureActionHttpMethod(descriptor, method) {

	let action = descriptor.value;
	
	if (!action[config.actionTag]) {
		Object.defineProperty(action, config.actionTag, {
			enumerable: false,
			writable: false,
			value: true
		});
	}
	
	if (!action[config.httpMethodsProp]) {
		Object.defineProperty(action, config.httpMethodsProp, {
			enumerable: false,
			writable: false,
			value: []
		});			
	}
	
	action[config.httpMethodsProp].push(method);
	
	return descriptor;
}

function configureControllerHttpMethod(target, method) {

	if (!target[config.httpMethodsProp]) {
		Object.defineProperty(target, config.httpMethodsProp, {
			enumerable: false,
			writable: false,
			value: []
		});			
	}
	
	target[config.httpMethodsProp].push(method);
	
	return target;
}
