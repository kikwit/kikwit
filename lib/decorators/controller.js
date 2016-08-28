'use strict';

import * as configurer from '../configurer';

export function controller(target) {

    if (!target.name || target.name == '_default') {
        throw new Error('Anonymous controllers not supported', target.toString());
    }

    Object.defineProperty(target, configurer.controllerTag, {
        enumerable: false,
        writable: false,
        value: true
    });

    let actions = getControllerActions(target);

    Object.defineProperty(target, configurer.actionsProp, {
        enumerable: false,
        writable: false,
        value: new Set(actions)
    });

    return target;
}

function getControllerActions(target) {

    let propKeys = configurer.getAllProperties(target);

    let prop;
    let actions = [];

    for (let key of propKeys) {

        prop = target.prototype[key];

        if (!prop || !prop[configurer.actionTag]) {
            continue;
        }

        actions.push(prop);
    }

    return actions;
}
