'use strict';

import * as configurer from '../configurer';

export function webSocket(target, key, descriptor) {

    if (descriptor) {

        throw new TypeError(`The @webSocket decorator is not allowed on methods [${target.name}#${descriptor.value}].`);
    }
    
    Object.defineProperty(target, configurer.webSocketProp, {
        enumerable: false,
        writable: false,
        value: true
    });
}

