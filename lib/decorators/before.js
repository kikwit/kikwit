'use strict';

import * as configurer from '../configurer';

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

    Object.defineProperty(target, configurer.beforeProp, {
        enumerable: false,
        writable: false,
        value: [...(target[configurer.beforeProp] || []), ...interceptors]
    });

    return target;
}

function configureAction(interceptors, descriptor) {

    if (descriptor[configurer.beforeProp]) {
        throw new Error(duplicateBeforeErrorMessage);
    }

    let action = descriptor.value;

    Object.defineProperty(action, configurer.beforeProp, {
        enumerable: false,
        writable: false,
        value: interceptors
    });

    return descriptor;
}
