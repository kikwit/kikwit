'use strict';

import * as configurer from '../configurer';

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

    Object.defineProperty(target, configurer.afterProp, {
        enumerable: false,
        writable: false,
        value: [...interceptors, ...(target[configurer.afterProp] || [])]
    });

    return target;
}

function configureAction(interceptors, descriptor) {

    if (descriptor[configurer.afterProp]) {

        throw new Error(duplicateAfterErrorMessage);
    }

    let action = descriptor.value;

    Object.defineProperty(action, configurer.afterProp, {
        enumerable: false,
        writable: false,
        value: interceptors
    });

    return descriptor;
}
