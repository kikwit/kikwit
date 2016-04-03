'use strict';

import path from 'path';
import url from 'url';

import accepts from 'accepts';
import semver from 'semver';
import typeIs from 'type-is';

const pathPattern = /`([^`\s]+)(?:\s+([^`]+))?`/g;
const pathSeparator = '/';

export const defaultPathPattern = '([^\/]+?)';

export function parseRoute(path, caseSensitive, strict) {

    if (!path) {
        return;
    }

    let groupNames = [];

    let patternString = path.replace(pathPattern, (s, p1, p2) => {

        groupNames.push(p1);

        if (!p2) {
            return defaultPathPattern;
        }

        return `(${p2})`;
    });

    if (!patternString.startsWith(pathSeparator)) {
        patternString = pathSeparator + patternString;
    }

    if (!strict && patternString.endsWith(pathSeparator)) {
        patternString = patternString.slice(0, patternString.length - 1);
    }

    patternString = '^' + patternString + '$';

    let pattern;

    if (caseSensitive) {
        pattern = new RegExp(patternString);
    } else {
        pattern = new RegExp(patternString, 'i');
    }

    return {
        pattern,
        groupNames
    };
}

export function findRoute(appSettings, routes, request, requestPath) {

    if (!routes
        || !routes.length
        || !request
        || !request.url) {
        return;
    }

    if ((!appSettings.route || !appSettings.route.strict)
        && requestPath.endsWith(pathSeparator)) {

        requestPath = requestPath.slice(0, requestPath.length - 1);
    }

    const results = [];
    let matches;

    for (let route of routes) {

        if (route.groupNames.length) {
            
            matches = route.pattern.exec(requestPath);

            if (!matches) {
                continue;
            }        
        } else if (!route.pattern.test(requestPath)) {        
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

        const methodAllowed = httpMethodAllowed(route, request);

        if (!methodAllowed) {
            continue;
        }

        const params = {};

        for (let i = 0; i < route.groupNames.length; i++) {
            params[route.groupNames[i]] = matches[i + 1];
        }

        results.push({
            accept,
            acceptVersion,
            contentType,
            params,
            route
        });
    }

    if (!results.length) {
        return;
    }

    if (results.length == 1) {
        return results[0];
    }

    if (results[0].route.version) {
        // Sort by greater version first
        results.sort((a, b) => semver.lt(a.route.version, b.route.version));
        return results[0];
    }

    if (results[0].route.version) {
        // Sort by most specific route first
        results.sort((a, b) => a.route.groupNames.length - b.route.groupNames.length);
        return results[0];
    }

    return results[0];
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
