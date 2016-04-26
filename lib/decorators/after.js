'use strict';

import * as config from '../config';

const duplicateAfterErrorMessage = 'Only one @after decorator allowed.';

export function after(...interceptors) {

    return function(target, key, descriptor) {

        if (descriptor) {
            return configureAction(interceptors, descriptor);
        }

        return configureController(interceptors, target);
    }
}

function configureController(interceptors, target) {

    Object.defineProperty(target, config.afterProp, {
        enumerable: false,
        writable: false,
        value: [...interceptors, ...(target[config.afterProp] || [])]
    });

    return target;
}

function configureAction(interceptors, descriptor) {

    if (descriptor[config.afterProp]) {

        throw new Error(duplicateAfterErrorMessage);
    }

    let action = descriptor.value;

    Object.defineProperty(action, config.afterProp, {
        enumerable: false,
        writable: false,
        value: interceptors
    });

    return descriptor;
}
