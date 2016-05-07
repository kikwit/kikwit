'use strict';

import path from 'path';
import url from 'url';

import accepts from 'accepts';
import semver from 'semver';
import typeIs from 'type-is';

const pathPattern = /:([^<:/]+)(?:<([^>]+)>)?/g;
const pathSeparator = '/';

export const defaultPathPattern = '([^\/]+)';

const staticCache = new Map();

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

    let keys = [];

    let patternString = routePath.replace(pathPattern, (s, p1, p2) => {

        keys.push(p1);

        if (!p2) {
            return defaultPathPattern;
        }

        return `(${p2})`;
    });

    patternString = '^' + patternString + '$';

    let pattern, routePathNoKeys;

    if (caseSensitive) {

        pattern = new RegExp(patternString);

    } else {

        pattern = new RegExp(patternString, 'i');
        
        patternString = patternString.toLowerCase();

        if (!keys.length) {
            routePathNoKeys = routePath.toLowerCase();
        }
    }   

    const result = {
        keys,
        hits: 0,
        pattern,
        patternString
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

    let [key, result] = getCachedResult(request, pathname);

    if (result) {

        result.route.hits++;
        
        return result;
    }

    let matches;

    for (let route of routes) {
        
        const methodAllowed = httpMethodAllowed(route, request);

        if (!methodAllowed) {
            continue;
        }

        const accept = acceptAllowed(route, request);

        if (accept === false) {
            continue;
        }

        const acceptVersion = acceptVersionAllowed(route, request);

        if (acceptVersion === false) {
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
            acceptVersion,
            contentType,
            params,
            route
        };
        
        break;
    }

    if (!result) {
        return;
    }

    if (!result.route.keys.length) {
        
        staticCache.set(key, result);
    }

    result.route.hits++;

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

function acceptVersionAllowed(route, request) {

    const acceptVersion = request.headers['accept-version'];

    if (acceptVersion) {

        if (route.version && semver.satisfies(route.version, acceptVersion)) {
            return acceptVersion;
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

function getCachedResult(request, requestPath) {

    let key = request.method + ':'
            + requestPath + ':'
            + (request.headers['accept'] || '*') + ':'
            + (request.headers['version'] || '*') + ':'
            + (request.headers['content-type'] || '*');

    return [key, staticCache.get(key)];
}
