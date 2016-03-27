'use strict';

import fs from 'fs';
import os from 'os';
import path from 'path';

import appSettingsDefault from './appSettingsDefault';
import * as router from './router';

export const actionsProp = Symbol();
export const actionTag = Symbol();
export const afterProp = Symbol();
export const beforeProp = Symbol();
export const bodyParserProp = Symbol();
export const compressProp = Symbol();
export const consumesProp = Symbol();
export const controllerTag = Symbol();
export const httpMethodsProp = Symbol();
export const injectProp = Symbol();
export const injectSingletonProp = Symbol();
export const producesProp = Symbol();
export const queryParserProp = Symbol();
export const routeProp = Symbol();
export const versionProp = Symbol();

const routeDependenciesSingleton = {};
const routeDependencies = {};

let appSettings;

export function init() {

    mergeConfig();

    if (appSettings.staticFiles && appSettings.staticFiles.root) {
        setStaticFilesRootRegExp();
    }

    const dirPath = path.join(process.cwd(), appSettings.controllersRoot);
    const files = fs.readdirSync(dirPath)
                    .filter(x => x.endsWith('.js'))
                    .map(file => path.join(dirPath, file));
	
	return loadRoutes(files);
}

function mergeConfig() {
    
	appSettings = appSettingsDefault();
    
    appSettings.applicationRoot = KIKWIT_APPLICATION_ROOT;
    
    setEnvironment();
    
    appSettings = mergeRecursive(appSettings, getAppConfig());
    appSettings = mergeRecursive(appSettings, getAppConfig(appSettings.environment));
}

function setEnvironment() {
        
    if (process.env.NODE_ENV) {
        
        const env = String(process.env.NODE_ENV.trim());
        
        if (env) {
            appSettings.environment = env;            
        }
    }
}

function getAppConfig(name = 'default') {
    
    const appConfigPath = path.join(appSettings.applicationRoot, 'config', name) + '.js';

    try {

        let modul;

        // TODO Use fs.accessSync
        if (fs.existsSync(appConfigPath)) {

            try {
                modul = require(appConfigPath);
                
                if (modul && modul.default) {
                    return modul.default();
                }
            } catch (error) {
                // TODO Log configuration error
            }
        }        
    } catch (error) {
        // IGNORE
    }
    
    return {};
}

function loadRoutes(files) {

    const routes = [];
    
    let modul;
	let tmpRoutes;
        
    for (let file of files) {
        
        modul = require(file);
        
        if (!modul || !modul.default || !modul.default[controllerTag]) {
            continue;
        }
        
        tmpRoutes = configureRoutes(modul.default);
        
        routes.push(...tmpRoutes);         
    }
    
	return { appSettings, routes };
}

function configureRoutes(ctrl) {

	const routesList = [];
    
	const ctrlDecorators = getDecorators(ctrl);

	let actionDecorators;
	let route, tmpRoute, routePath;

	for (let action of ctrl[actionsProp]) {

		actionDecorators = getDecorators(action);

		route = {
			actionName: action.name,
			actionRoute: actionDecorators.route,
			after: [...actionDecorators.after, ...ctrlDecorators.after],
			before: [...ctrlDecorators.before, ...actionDecorators.before],
			bodyParser: getBodyParser(ctrlDecorators, actionDecorators),
			consumes: actionDecorators.consumes || ctrlDecorators.consumes,
            compress: getBooleanDecoratorValue(actionDecorators.compress, ctrlDecorators.compress),
			Controller: ctrl,
			controllerRoute: ctrlDecorators.route,
			httpMethods: actionDecorators.httpMethods || ctrlDecorators.httpMethods || ['get'],
			inject: [...ctrlDecorators.inject, ...actionDecorators.inject],
			produces: actionDecorators.produces || ctrlDecorators.produces,
			queryParser: getQueryParser(ctrlDecorators, actionDecorators),
			version: actionDecorators.version || ctrlDecorators.version
		};

		routePath = getRoutePath(route.Controller.name, route.controllerRoute, route.actionName, route.actionRoute)

		tmpRoute = router.parseRoute(routePath, appSettings.route.caseSensitive, appSettings.route.strict);

		route = mergeRecursive(route, tmpRoute);
		
		route.routePath = routePath;
        
        injectDependencies(route);

		routesList.push(route);
	}

	return routesList;
}

function getDecorators(target) {

	return {
		after: target[afterProp] || [],
		before: target[beforeProp] || [],
		bodyParser: target[bodyParserProp],
		consumes: target[consumesProp],
        compress: target[compressProp],
		httpMethods: target[httpMethodsProp],
		inject: target[injectProp] || [],
		produces: target[producesProp],
		queryParser: target[queryParserProp],
		route: target[routeProp] || {},
		version: target[versionProp],
	};
}

function getRoutePath(controllerName, controllerRoute, actionName, actionRoute) {

	let routePath = '';
	
	if (controllerRoute.path) {
		routePath = controllerRoute.path;
	} else {
		routePath = controllerName;
	}

	if (!routePath.startsWith('/')) {
		routePath = '/' + routePath;
	}

	if (!routePath.endsWith('/')) {
		routePath += '/';
	}
	
	if (actionRoute.path) {
		if (actionRoute.path.startsWith('/')) {
			routePath += actionRoute.path.slice(1);
		} else {
			routePath += actionRoute.path;
		}
	} else {
		routePath += actionName;
	}

	return routePath;
}

function getBodyParser(ctrlDecorators, actionDecorators) {

	let bodyParser;

	if (actionDecorators.bodyParser !== false) {

		bodyParser = actionDecorators.bodyParser;

		if (!bodyParser) {
			bodyParser = ctrlDecorators.bodyParser;
		}
	}
}

function getQueryParser(ctrlDecorators, actionDecorators) {

	let queryParser;

	if (actionDecorators.queryParser !== false) {

		queryParser = actionDecorators.queryParser;

		if (!queryParser) {
			queryParser = ctrlDecorators.queryParser;
		}
	}
}

function injectDependencies(route) {

    if (!route.inject || !route.inject.length) {
        return;
    }
    
    const injectErrFn = () => { throw new TypeError(`Invalid dependency for route: ${route.routePath}`) };
    
    if (!appSettings.dependencies) {
        injectErrFn();
    }
    
    const injectsMap = getInjectsMap(route.inject, injectErrFn);
  
    const routeDependencies = Object.create(null);
    let dependency;

    for (let [key, value] of injectsMap) {
        
        if (!Object.keys(appSettings.dependencies).find(x => x === value)) {
            injectErrFn();   
        }

        dependency = appSettings.dependencies[value];

        routeDependencies[key] = dependency;
    };
    
    route.dependencies = routeDependencies;
}

function getInjectsMap(injects, injectErrFn) {
   
    const injectsMap = new Map();
    
    for (let injectItem of injects) {
      
        switch(typeof injectItem) {
            
            case 'string':
                injectsMap.set(injectItem, injectItem);
                break;
                
            case 'object':
                 for (let key of Object.keys(injectItem)) { 
                     injectsMap.set(key, injectItem[key]);
                 } 
                 break;
                 
            default: 
                injectErrFn();
        }   
    }  
  
    return injectsMap;
}

export function setStaticFilesRootRegExp() {
    
    let root = appSettings.staticFiles.root;
    
    if (!root.startsWith('/')) {
        root = '/' + root;
    }
    
    if (root.endsWith('/')) {
        root = root.slice(0, root.length - 1);
    }
    
    const pattern = `^${root}(?:/(.*))?`;
    let rootRegExp;
    
    switch (os.platform()) {
        
        case 'win32':
            rootRegExp = new RegExp(pattern, 'i');
            break;
            
        default:
            rootRegExp = new RegExp(pattern);
            break;   
    }

    appSettings.staticFiles.rootRegExp = rootRegExp;
}

function getBooleanDecoratorValue(actionVal, ctrlVal) {
    
    if (actionVal !== undefined && actionVal !== null) {
        return actionVal;
    } 
    
    return ctrlVal;
}

function mergeRecursive(obj1, obj2) {

	for (var prop of Object.keys(obj2)) {
		try {
			if (obj2[prop].constructor == Object) {
				obj1[prop] = mergeRecursive(obj1[prop], obj2[prop]);
			} else {
				obj1[prop] = obj2[prop];
			}
		} catch (e) {
			obj1[prop] = obj2[prop];
		}
	}

	return obj1;
}
