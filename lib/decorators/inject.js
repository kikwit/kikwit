'use strict';

import * as configurer from '../configurer';

const duplicateInjectErrorMessage = 'Only one inject decorator allowed.';

export function inject(...serviceKeys) {

    return function(target, prop, descriptor) {

        if (descriptor) {
            return configureAction(serviceKeys, descriptor, configurer.injectProp);
        }

        return configureController(serviceKeys, target, configurer.injectProp);
    }
}

function configureController(serviceKeys, target, propName) {

    Object.defineProperty(target, propName, {
        enumerable: false,
        writable: false,
        value: [...(target[propName] || []), ...serviceKeys]
    });

    return target;
}

function configureAction(serviceKeys, descriptor, propName) {

    if (descriptor[propName]) {

        throw new Error(duplicateInjectErrorMessage);
    }

    let action = descriptor.value;

    Object.defineProperty(action, propName, {
        enumerable: false,
        writable: false,
        value: serviceKeys
    });

    return descriptor;
}
