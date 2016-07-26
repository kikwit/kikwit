'use strict';

import path from 'path';
import url from 'url';

import accepts from 'accepts';
import typeIs from 'type-is';

const pathPattern = /:([^<:/]+)(?:<([^>]+)>)?/g;
const optionalPathPattern = /:(?:[^<:/])+\?$/;
const pathSeparator = '/';

export const defaultPathPattern = '[^<:/]+';

export function parseRoute(routePath, caseSensitive, strict) {

    if (!routePath) {
        return;
    }

    if (!routePath.startsWith(pathSeparator)) {
        routePath = pathSeparator + routePath;
    }

    if (!strict && routePath.endsWith(pathSeparator)) {
        routePath = routePath.slice(0, routePath.length - 1);
    }

    let optional = false;

    if (optionalPathPattern.test(routePath)) {

        optional = true;

        routePath = routePath.slice(0, routePath.length - 1);
    }

    let keys = [];

    let patternString = routePath.replace(pathPattern, (s, p1, p2) => {

        keys.push(p1);

        if (!p2) {
            return (optional ? '?' : '') + `(${defaultPathPattern})` + (optional ? '?' : '');
        }

        return `(${p2})`;
    });

    patternString = '^' + patternString + '$';
    let pattern, routePathNoKeys;

    if (caseSensitive) {

        pattern = new RegExp(patternString);

    } else {

        pattern = new RegExp(patternString, 'i');

        if (!keys.length) {
            routePathNoKeys = routePath.toLowerCase();
        }
    }   

    const result = {
        keys,
        pattern
    };

    if (routePathNoKeys) {
        result.routePathNoKeys = routePathNoKeys;
    }

    return result;
}

export function findRoute({config, routes, request, pathname}) {

    if (!config
        ||!routes
        || !routes.length
        || !request
        || !request.url
        || !pathname) {
        return;
    }

    pathname = pathname.replace(/\\/g, '/');
    
    if ((!config.route || !config.route.strict)
        && pathname.endsWith(pathSeparator)) {

        pathname = pathname.slice(0, pathname.length - 1);
    }

    let matches, key, result;

    for (let route of routes) {
        
        const methodAllowed = httpMethodAllowed(route, request);

        if (!methodAllowed) {
            continue;
        }

        const accept = acceptAllowed(route, request);

        if (accept === false) {
            continue;
        }

        const contentType = contentTypeAllowed(route, request);

        if (contentType === false) {
            continue;
        }
        
        if (route.keys.length) {

            matches = route.pattern.exec(pathname);

            if (!matches) {
                continue;
            }

        } else if (route.routePathNoKeys != pathname.toLowerCase()) {
            continue;
        }

        const params = {};

        for (let i = 0; i < route.keys.length; i++) {
            params[route.keys[i]] = matches[i + 1];
        }

        result = {
            accept,
            contentType,
            params,
            route
        };
        
        break;
    }

    if (!result) {
        return;
    }

    return result;
}

function acceptAllowed(route, request) {

    if (route.produces && route.produces.length) {

        const accept = accepts(request).type(route.produces);

        if (accept) {
            return accept;
        }

        return false;
    }

    return;
}

function contentTypeAllowed(route, request) {

    if (route.consumes && route.consumes.length) {

        const contentType = typeIs(request, route.consumes);

        if (contentType) {
            return contentType;;
        }

        return false;
    }

    return;
}

function httpMethodAllowed(route, request) {

    const reqHttpMethod = request.method.toLowerCase();
    const httpMethodAllowed = route.httpMethods.some(x => x == 'all' || x == reqHttpMethod);

    return httpMethodAllowed;
}

