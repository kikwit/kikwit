'use strict';

import * as configurer from '../configurer';

export function queryParser(parser) {

    return function(target, key, descriptor) {

        if (descriptor) {
            return configureAction(parser, descriptor);
        }

        return configureController(parser, target);
    }
}

function configureController(parser, target) {

    if (parser) {
        Object.defineProperty(target, configurer.queryParserProp, {
            enumerable: false,
            writable: false,
            value: parser
        });
    }

    return target;
}

function configureAction(parser, descriptor) {

    if (parser) {
        let action = descriptor.value;
        Object.defineProperty(action, configurer.queryParserProp, {
            enumerable: false,
            writable: false,
            value: parser
        });
    }

    return descriptor;
}
