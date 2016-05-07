'use strict';

import * as configurer from '../configurer';

const duplicateInjectErrorMessage = 'Only one inject decorator allowed.';

export function inject(...injects) {

    return function(target, key, descriptor) {

        if (descriptor) {
            return configureAction(injects, descriptor, configurer.injectProp);
        }

        return configureController(injects, target, configurer.injectProp);
    }
}

function configureController(injects, target, propName) {

    Object.defineProperty(target, propName, {
        enumerable: false,
        writable: false,
        value: [...(target[propName] || []), ...injects]
    });

    return target;
}

function configureAction(injects, descriptor, propName) {

    if (descriptor[propName]) {

        throw new Error(duplicateInjectErrorMessage);
    }

    let action = descriptor.value;

    Object.defineProperty(action, propName, {
        enumerable: false,
        writable: false,
        value: injects
    });

    return descriptor;
}
