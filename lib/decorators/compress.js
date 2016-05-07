'use strict';

import * as configurer from '../configurer';

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

    if (target[configurer.compressProp]) {
        throw new Error(duplicateCompressErrorMessage);
    }

    Object.defineProperty(target, configurer.compressProp, {
        enumerable: false,
        writable: false,
        value: enable
    });

    return target;
}

function configureAction(enable, descriptor) {

    if (descriptor[configurer.compressProp]) {
        throw new Error(duplicateCompressErrorMessage);
    }

    let action = descriptor.value;

    Object.defineProperty(action, configurer.compressProp, {
        enumerable: false,
        writable: false,
        value: enable
    });

    return descriptor;
}
