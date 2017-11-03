'use strict';

import * as configurer from '../configurer';

export function requestMaxSize(size) {

    if (!Number.isFinite(size)) {
        throw new TypeError(`@requestMaxSize(${size}) - argument must be a valid number`);
    }

    return function(target, key, descriptor) {

        if (descriptor) {
            return configureAction(size, descriptor);
        }

        return configureController(size, target);
    }
}

function configureController(size, target) {

    if (size) {
        Object.defineProperty(target, configurer.requestMaxSizeProp, {
            enumerable: false,
            writable: false,
            value: size
        });
    }

    return target;
}

function configureAction(size, descriptor) {

    if (size) {
        let action = descriptor.value;
        Object.defineProperty(action, configurer.requestMaxSizeProp, {
            enumerable: false,
            writable: false,
            value: size
        });
    }

    return descriptor;
}
