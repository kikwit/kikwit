'use strict';

import * as configurer from '../configurer';

export function service(key, singleton) {

    return function(target, prop, descriptor) {

        if (!key || !key.trim().length) {
            throw new Error('Invalid @service key for', target.toString());
        }

        return configureService(key, singleton, target);
    }
}

function configureService(key, singleton, target) {

    Object.defineProperty(target, configurer.serviceProp, {
        enumerable: false,
        writable: false,
        value: { key, singleton: singleton === true }
    });

    return target;
}

