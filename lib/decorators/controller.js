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

    let propKeys = getAllProperties(target);

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

function getAllProperties(target) {

    if (!target || !target.prototype) {
        return [];
    }

    let props = [];

    Object.getOwnPropertyNames(target.prototype)
        .filter(x => x != 'constructor')
        .forEach(x => props.push(x));

    props.push(...getAllProperties(Object.getPrototypeOf(target)));

    return props;
}