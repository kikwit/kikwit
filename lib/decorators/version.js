'use strict';

import * as config from '../config';

const versionPattern = /^\s*\d+\.\d+.\d+\s*$/;

export function version(value) {

    if (!versionPattern.test(value)) {
        throw new Error(`Incorrect version header: [${value}]`);
    }

    return function(target, key, descriptor) {

        if (descriptor) {
            return configureAction(value, descriptor);
        }

        return configureController(value, target);
    }
}

function configureController(value, target) {

    Object.defineProperty(target, config.versionProp, {
        enumerable: false,
        writable: false,
        value: value
    });

    return target;
}

function configureAction(value, descriptor) {

    let action = descriptor.value;

    Object.defineProperty(action, config.versionProp, {
        enumerable: false,
        writable: false,
        value: value
    });

    return descriptor;
}
