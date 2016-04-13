'use strict';

import * as config from '../config';

export function bodyParser(parser) {

    return function(target, key, descriptor) {

        if (descriptor) {
            return configureAction(parser, descriptor);
        }

        return configureController(parser, target);
    }
}

function configureController(parser, target) {

    if (parser) {
        Object.defineProperty(target, config.bodyParserProp, {
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
        Object.defineProperty(action, config.bodyParserProp, {
            enumerable: false,
            writable: false,
            value: parser
        });
    }

    return descriptor;
}
