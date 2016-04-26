'use strict';

import * as config from '../config';

const duplicateBeforeErrorMessage = 'Only one @before decorator allowed.';

export function before(...interceptors) {

    return function(target, key, descriptor) {

        if (descriptor) {
            return configureAction(interceptors, descriptor);
        }

        return configureController(interceptors, target);
    }
}

function configureController(interceptors, target) {

    Object.defineProperty(target, config.beforeProp, {
        enumerable: false,
        writable: false,
        value: [...(target[config.beforeProp] || []), ...interceptors]
    });

    return target;
}

function configureAction(interceptors, descriptor) {

    if (descriptor[config.beforeProp]) {
        throw new Error(duplicateBeforeErrorMessage);
    }

    let action = descriptor.value;

    Object.defineProperty(action, config.beforeProp, {
        enumerable: false,
        writable: false,
        value: interceptors
    });

    return descriptor;
}
