'use strict';

import * as configurer from '../configurer';

const duplicateOnErrorMessage = 'Only one @onError decorator allowed.';

export function onError(handler) {

    return function(target, key, descriptor) {

        if (descriptor) {
            return configureAction(handler, descriptor);
        }

        return configureController(handler, target);
    }
}

function configureController(handler, target) {

    Object.defineProperty(target, configurer.onErrorProp, {
        enumerable: false,
        writable: false,
        value: handler
    });

    return target;
}

function configureAction(handler, descriptor) {

    if (descriptor[configurer.onErrorProp]) {
        throw new Error(duplicateOnErrorMessage);
    }

    let action = descriptor.value;

    Object.defineProperty(action, configurer.onErrorProp, {
        enumerable: false,
        writable: false,
        value: handler
    });

    return descriptor;
}
