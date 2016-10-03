'use strict';

import fs from 'fs';
import os from 'os';
import path from 'path';

import baseConfig from './baseConfig';
import DebugController from './app/controllers/debug';
import * as serviceResolver from './serviceResolver';
import ViewResolver from './viewResolver';
import ConfigurationBuilder from './configurationBuilder';
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
export const listenerProp = Symbol();
export const onErrorProp = Symbol();
export const producesProp = Symbol();
export const queryParserProp = Symbol();
export const routeProp = Symbol();
export const serviceProp = Symbol();
export const webSocketProp = Symbol();

let appConfig;

export function init(configureFunction) {

    appConfig = baseConfig();

    appConfig.applicationRoot = KIKWIT_APPLICATION_ROOT;

    setEnvironment();

    const services = loadServices();

    appConfig.resolveService = (key) => serviceResolver.resolve(key, appConfig, services);

    if (configureFunction) {

        const configurationBuilder = new ConfigurationBuilder(appConfig, services);

        configureFunction(configurationBuilder);

        configurationBuilder.finalize();
    }

    if (appConfig.staticFiles && appConfig.staticFiles.root) {
        setStaticFilesRootRegExp();
    }

    setViewResolver();

    const controllersBasePath = path.join(appConfig.applicationRoot, appConfig.controllersRoot);
    const controllerFiles = readdirRecursiveSync(controllersBasePath).filter(x => x.endsWith('.js'));
    const routes = loadRoutes(controllersBasePath, controllerFiles, services);

    return { appConfig, routes, services };
}

function setViewResolver() {

    if (appConfig.views.resolver) {
        return;
    }

    appConfig.views.resolver = new ViewResolver(appConfig.environment);
}

function setEnvironment() {

    if (process.env.NODE_ENV) {

        const env = String(process.env.NODE_ENV.trim());

        if (env) {
            appConfig.environment = env;
        }
    }
}

function loadRoutes(controllersBasePath, controllerFiles, services) {

    const routes = [];

    let modul;
    let tmpRoutes;
    let ctrlFile;
    let exportedItemKeys;
    let exportedItem;

    for (let file of controllerFiles) {

        modul = require(file);

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
    }

    if (appConfig.environment == 'development') {
        routes.push(...getDebugRoutes(services));
    }

    return routes;
}

function configureRoutes(ctrlFile, ctrl) {

    const routesList = [];
    let tmpRoute, route, routePath;

    const ctrlDecorators = getDecorators(ctrl);

    if (ctrlDecorators.webSocket) {

        route = generateWebSocketRoute(ctrl, ctrlDecorators, ctrlFile);

        routePath = getRoutePath(route.controllerBasename, route.controllerRoute);

        tmpRoute = router.parseRoute(routePath, appConfig.route.caseSensitive, appConfig.route.strict);

        route = appConfig.mergeRecursive(route, tmpRoute);

        route.routePath = routePath;

        routesList.push(route);
    }

    let actionDecorators;

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
            services: {}
        };

        routePath = getRoutePath(route.controllerBasename, route.controllerRoute, route.actionName, route.actionRoute);

        tmpRoute = router.parseRoute(routePath, appConfig.route.caseSensitive, appConfig.route.strict);

        route = appConfig.mergeRecursive(route, tmpRoute);

        route.routePath = routePath;

        routesList.push(route);
    }

    return routesList;
}

function getDebugRoutes(services) {

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

        route = appConfig.mergeRecursive(route, tmpRoute);

        route.routePath = routePath;
        route.serviceMap = services;

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
        webSocket: target[webSocketProp],
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

    if (actionRoute && actionRoute.path) {
        if (actionRoute.path.startsWith('/')) {
            routePath += actionRoute.path.slice(1);
        } else {
            routePath += actionRoute.path;
        }
    } else if (actionName) {
        routePath += actionName;
    }

    return routePath;
}

function loadServices() {

    const servicesBasePath = path.join(appConfig.applicationRoot, appConfig.servicesRoot);
    const serviceFiles = readdirRecursiveSync(servicesBasePath).filter(x => x.endsWith('.js'));

    let modul;
    let serviceOptions;
    let exportedItemKeys;
    let exportedItem;
    let serviceEntry;

    const services = new Map();

    for (let file of serviceFiles) {

        modul = require(file);

        if (!modul) {
            continue;
        }

        exportedItemKeys = Object.keys(modul);

        for (let key of exportedItemKeys) {

            exportedItem = modul[key];

            if (!exportedItem || !exportedItem[serviceProp]) {
                continue;
            }

            serviceOptions = exportedItem[serviceProp];

            let serviceFile = file.substring(servicesBasePath.length);

            if (serviceFile.startsWith(path.sep)) {
                serviceFile = serviceFile.substring(1);
            }

            serviceEntry = {
                serviceFile: serviceFile,
                singleton: serviceOptions.singleton,
                Class: exportedItem,
                inject: exportedItem[injectProp] || [],
                servicesSingleton: new Map(),
                servicesPrototype: new Map()
            };

            if (serviceEntry.singleton) {
                serviceEntry.instance = new serviceEntry.Class();
            }

            services.set(serviceOptions.key, serviceEntry);
        }
    }

    serviceResolver.resolveDependencies(services);

    return services;
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

    return queryParser;
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

export function getAllProperties(target) {

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

function generateWebSocketRoute(ctrl, ctrlDecorators, ctrlFile) {

    return {
        after: [],
        before: [],
        bodyParser: false,
        consumes: [],
        Controller: ctrl,
        controllerRoute: ctrlDecorators.route,
        controllerFile: ctrlFile,
        controllerBasename: path.join(path.dirname(ctrlFile), ctrl.name),
        httpMethods: ['get'],
        inject: [...ctrlDecorators.inject],
        listeners: getWebSocketListeners(ctrl),
        onError: ctrlDecorators.onError,
        produces: [],
        services: {},
        webSocket: true
    };    
}

function getWebSocketListeners(ctrl) {

    const result = {};
    
    const propKeys = getAllProperties(ctrl);
    let prop, listener;

    for (let key of propKeys) {

        prop = ctrl.prototype[key];

        if (!prop || !prop[listenerProp]) {
            continue;
        }

        listener = prop[listenerProp];
        
        result[listener] = prop.name;
    }

    return result;
}

function getBooleanDecoratorValue(actionVal, ctrlVal) {

    if (actionVal !== undefined && actionVal !== null) {
        return actionVal;
    }

    return ctrlVal;
}

function readdirRecursiveSync(dir, filelist) {

    let files;

    try {

        fs.accessSync(dir);

        files = fs.readdirSync(dir);

    } catch (ex) {
        files = [];
    }

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

