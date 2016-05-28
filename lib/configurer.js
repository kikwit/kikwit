'use strict';

import fs from 'fs';
import os from 'os';
import path from 'path';

import baseConfig from './baseConfig';
import DebugController from './app/controllers/debug';
import ViewResolver from './viewResolver';
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
export const onErrorProp = Symbol();
export const producesProp = Symbol();
export const queryParserProp = Symbol();
export const routeProp = Symbol();
export const versionProp = Symbol();

const routeDependenciesSingleton = {};
const routeDependencies = {};

let appConfig;

export function init() {

    mergeConfig();

    if (appConfig.staticFiles && appConfig.staticFiles.root) {
        setStaticFilesRootRegExp();
    }
    
    setViewResolver();
    setLogger();

    const controllersBasePath = path.join(appConfig.applicationRoot, appConfig.controllersRoot);
    const files = readdirRecursiveSync(controllersBasePath)
                    .filter(x => x.endsWith('.js'));

	return loadRoutes(controllersBasePath, files);
}

function setViewResolver() {
    
    if (appConfig.views.resolver) {
        return;
    }
    
    appConfig.views.resolver = new ViewResolver(appConfig.environment); 
}

function setLogger() {
    
    let logger;
    
    if (appConfig.logger) {
        
        logger = appConfig.logger;
        
    } else if (appConfig.environment == 'development') {
        
        logger = console;
    }
    
    appConfig.logger = logger;
}

function mergeConfig() {
    
	appConfig = baseConfig();
    
    appConfig.applicationRoot = KIKWIT_APPLICATION_ROOT;
    
    setEnvironment();
    
    appConfig = mergeRecursive(appConfig, getAppConfig());
    appConfig = mergeRecursive(appConfig, getAppConfig(appConfig.environment));
}

function setEnvironment() {
        
    if (process.env.NODE_ENV) {
        
        const env = String(process.env.NODE_ENV.trim());
        
        if (env) {
            appConfig.environment = env;            
        }
    }
}

function getAppConfig(name = 'default') {
    
    const appConfigPath = path.join(appConfig.applicationRoot, 'config', name) + '.js';

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

function loadRoutes(controllersBasePath, files) {

    const routes = [];
    
    let modul;
	let tmpRoutes;
    let ctrlFile;
    let exportedItemKeys;
    let exportedItem;
        
    for (let file of files) {
        
        modul = require(file);
        
        // if (!modul || !modul.default || !modul.default[controllerTag]) {
            
        //     continue;
        // }
        
        if (!modul) {            
            continue;
        }        
        
        exportedItemKeys = Object.keys(modul);
      
        for (let key of exportedItemKeys) {
            
            exportedItem = modul[key];
          
            if (!exportedItem || !exportedItem[controllerTag]) {  
                continue;
            }   
                
            ctrlFile = path.relative(controllersBasePath, file);
            tmpRoutes = configureRoutes(ctrlFile, exportedItem);
            
            routes.push(...tmpRoutes);        
        }
        
        // ctrlFile = path.relative(controllersBasePath, file);
        // tmpRoutes = configureRoutes(ctrlFile, modul.default);
        
        // routes.push(...tmpRoutes);         
    }    
    
    router.sortRoutes(routes);
    
    routes.push(...getDebugRoutes());
    
	return { appConfig, routes };
}

function configureRoutes(ctrlFile, ctrl) {

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
            controllerFile: ctrlFile,
            controllerBasename: path.join(path.dirname(ctrlFile), ctrl.name),
			httpMethods: actionDecorators.httpMethods || ctrlDecorators.httpMethods || ['get'],
			inject: [...ctrlDecorators.inject, ...actionDecorators.inject],
            onError: actionDecorators.onError || ctrlDecorators.onError,
			produces: actionDecorators.produces || ctrlDecorators.produces,
			queryParser: getQueryParser(ctrlDecorators, actionDecorators),
			version: actionDecorators.version || ctrlDecorators.version
		};

		routePath = getRoutePath(route.controllerBasename, route.controllerRoute, route.actionName, route.actionRoute);

		tmpRoute = router.parseRoute(routePath, appConfig.route.caseSensitive, appConfig.route.strict);

		route = mergeRecursive(route, tmpRoute);
		
		route.routePath = routePath;
        
        injectDependencies(route);

		routesList.push(route);
	}

	return routesList; 
}

function getDebugRoutes() {
    
	const routesList = [];

	let route, tmpRoute, routePath;

    const actions = Reflect.ownKeys(DebugController.prototype).filter(x => x != 'constructor');
    
	for (let action of actions) {

		route = {
			actionName: action,
			after: [],
			before: [],
            Controller: DebugController,
			httpMethods: ['get'],
			inject: []
		};

		routePath = `/_debug/${action}`;

		tmpRoute = router.parseRoute(routePath, appConfig.route.caseSensitive, appConfig.route.strict);

		route = mergeRecursive(route, tmpRoute);
		
		route.routePath = routePath;

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
        onError: target[onErrorProp],
		produces: target[producesProp],
		queryParser: target[queryParserProp],
		route: target[routeProp] || {},
		version: target[versionProp],
	};
}

function getRoutePath(controllerBasename, controllerRoute, actionName, actionRoute) {

	let routePath = '';
	
	if (controllerRoute.path) {
		routePath = controllerRoute.path;
	} else {
		routePath = controllerBasename;
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
    
    const injectErrFn = () => { throw new Error(`Invalid dependency for route: ${route.routePath}`) };
    
    if (!appConfig.dependencies) {
        injectErrFn();
    }
    
    const injectsMap = getInjectsMap(route.inject, injectErrFn);
  
    const routeDependencies = Object.create(null);
    let dependency;

    for (let [key, value] of injectsMap) {
        
        if (!Object.keys(appConfig.dependencies).find(x => x === value)) {
            injectErrFn();   
        }

        dependency = appConfig.dependencies[value];

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
    
    let root = appConfig.staticFiles.root;
    
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

    appConfig.staticFiles.rootRegExp = rootRegExp;
}

function getBooleanDecoratorValue(actionVal, ctrlVal) {
    
    if (actionVal !== undefined && actionVal !== null) {
        return actionVal;
    } 
    
    return ctrlVal;
}

function readdirRecursiveSync(dir, filelist) {

  var files = fs.readdirSync(dir);
  
  filelist = filelist || [];
  
  files.forEach(file => {
  
    const fPath = path.join(dir, file);
    
    if (fs.statSync(fPath).isDirectory()) {
      filelist = readdirRecursiveSync(fPath, filelist);
    }
    else {
      filelist.push(fPath);
    }
  });
  
  return filelist;
};

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
