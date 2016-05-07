'use strict';

import * as configurer from '../configurer';

export function all(target, key, descriptor) {

    if (descriptor) {

        delete descriptor.value[configurer.httpMethodsProp];

        descriptor = configureHttpMethod(null, descriptor, 'all');

        Object.freeze(descriptor.value[configurer.httpMethodsProp]);

        return descriptor;
    }

    delete target[configurer.httpMethodsProp];

    target = configureHttpMethod(target, null, 'all');

    Object.freeze(target[configurer.httpMethodsProp]);

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

    if (!action[configurer.actionTag]) {
        Object.defineProperty(action, configurer.actionTag, {
            enumerable: false,
            writable: false,
            value: true
        });
    }

    if (!action[configurer.httpMethodsProp]) {
        Object.defineProperty(action, configurer.httpMethodsProp, {
            enumerable: false,
            writable: false,
            value: []
        });
    }

    action[configurer.httpMethodsProp].push(method);

    return descriptor;
}

function configureControllerHttpMethod(target, method) {

    if (!target[configurer.httpMethodsProp]) {
        Object.defineProperty(target, configurer.httpMethodsProp, {
            enumerable: false,
            writable: false,
            value: []
        });
    }

    target[configurer.httpMethodsProp].push(method);

    return target;
}
