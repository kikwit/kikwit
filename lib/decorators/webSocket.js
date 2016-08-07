'use strict';

import * as configurer from '../configurer';

export function webSocket(target, key, descriptor) {

    if (!descriptor) {
        
        var targetName = target.name;
          
        throw new TypeError(`The @webSocket decorator is not allowed on controllers [${ targetName }].`);
    }

    let action = descriptor.value;

    if (descriptor[configurer.webSocketProp]) {
        throw new Error(`Only one @webSocket decorator allowed on action [${action}].`);
    }

    Object.defineProperty(action, configurer.webSocketProp, {
        enumerable: false,
        writable: false,
        value: true
    });

    Object.defineProperty(action, configurer.actionTag, {
        enumerable: false,
        writable: false,
        value: true
    });   

    Object.defineProperty(action, configurer.httpMethodsProp, {
        enumerable: false,
        writable: false,
        value: ['get']
    });    

    return descriptor;
}

