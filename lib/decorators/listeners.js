'use strict';

import * as configurer from '../configurer';

export function onClose(target, key, descriptor) {
    return configure(descriptor, 'onClose');
}

export function onConnect(target, key, descriptor) {
    return configure(descriptor, 'onConnect');
}

export function onMessage(target, key, descriptor) {
    return configure(descriptor, 'onMessage');
}

export function onPing(target, key, descriptor) {
    return configure(descriptor, 'onPing');
}

export function onPong(target, key, descriptor) {
    return configure(descriptor, 'onPong');
}

function configure(descriptor, listener) {

    let action = descriptor.value;

    Object.defineProperty(action, configurer.listenerProp, {
        enumerable: false,
        writable: false,
        value: listener
    });

    return descriptor;
}

