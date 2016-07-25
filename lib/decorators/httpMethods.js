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

export function baselineControl(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'baseline-control');
}

export function checkout(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'checkout');
}

export function checkin(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'checkin');
}

export function copy(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'copy');
}

export function del(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'delete');
}

export function get(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'get');
}

export function head(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'head');
}

export function label(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'label');
}

export function lock(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'lock');
}

export function merge(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'merge');
}

export function mkactivity(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'mkactivity');
}

export function mkcol(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'mkcol');
}

export function mkworkspace(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'mkworkspace');
}

export function move(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'move');
}

export function options(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'options');
}

export function orderpatch(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'orderpatch');
}

export function patch(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'patch');
}

export function post(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'post');
}

export function propfind(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'propfind');
}

export function proppatch(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'proppatch');
}

export function put(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'put');
}

export function report(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'report');
}

export function search(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'search');
}

export function trace(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'trace');
}

export function unlock(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'unlock');
}

export function update(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'update');
}

export function versionControl(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'version-control');
}

export function uncheckout(target, key, descriptor) {
    return configureHttpMethod(target, descriptor, 'uncheckout');
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
