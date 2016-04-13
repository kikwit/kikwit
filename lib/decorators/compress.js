'use strict';

import * as config from '../config';

const duplicateCompressErrorMessage = 'Only one @compress decorator allowed.';

export function compress(enable) {

    return function(target, key, descriptor) {

        if (descriptor) {
            return configureAction(enable, descriptor);
        }

        return configureController(enable, target);
    }
}

function configureController(enable, target) {

    if (target[config.compressProp]) {
        throw new Error(duplicateCompressErrorMessage);
    }

    Object.defineProperty(target, config.compressProp, {
        enumerable: false,
        writable: false,
        value: enable
    });

    return target;
}

function configureAction(enable, descriptor) {

    if (descriptor[config.compressProp]) {
        throw new Error(duplicateCompressErrorMessage);
    }

    let action = descriptor.value;

    Object.defineProperty(action, config.compressProp, {
        enumerable: false,
        writable: false,
        value: enable
    });

    return descriptor;
}
