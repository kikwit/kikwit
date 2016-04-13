'use strict';

import * as config from '../config';

const duplicateBeforeErrorMessage = 'Only one @before decorator allowed.';

export function before(...handlers) {

    return function(target, key, descriptor) {

        if (descriptor) {
            return configureAction(handlers, descriptor);
        }

        return configureController(handlers, target);
    }
}

function configureController(handlers, target) {

    Object.defineProperty(target, config.beforeProp, {
        enumerable: false,
        writable: false,
        value: [...(target[config.beforeProp] || []), ...handlers]
    });

    return target;
}

function configureAction(handlers, descriptor) {

    if (descriptor[config.beforeProp]) {
        throw new Error(duplicateBeforeErrorMessage);
    }

    let action = descriptor.value;

    Object.defineProperty(action, config.beforeProp, {
        enumerable: false,
        writable: false,
        value: handlers
    });

    return descriptor;
}
