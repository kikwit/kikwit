import fs from 'fs';
import path from 'path';

import mustache from 'mustache';

const viewsRoot = './node_modules/kikwit/lib/app/views';

export default class Debug {
     
    overview(ctx) {
    
        const template = fs.readFileSync(`${viewsRoot}/Debug/overview.mustache`, 'utf-8');
        const header = fs.readFileSync(`${viewsRoot}/Debug/_header.mustache`, 'utf-8');
        const footer = fs.readFileSync(`${viewsRoot}/Debug/_footer.mustache`, 'utf-8');

        const services = getServices(ctx);

        const model = {
            routes: getRoutes(ctx, services),
            services: services,
            servicesRoot: path.join(ctx.config.applicationRoot, ctx.config.servicesRoot),
            controllersRoot: path.join(ctx.config.applicationRoot, ctx.config.controllersRoot)
        };
        
        const output = mustache.render(template, model, { header, footer });

        ctx.send(output, 'text/html');
    }
}

function getRoutes(ctx, services) {

    const routes = 
             ctx.routes
                .sort((x, y) => x.routePath.toLowerCase() > y.routePath.toLowerCase())
                .filter(x => !x.routePath.startsWith('/_debug/'))
                .map(x => ({
                        httpMethods: x.httpMethods.join(', ').toUpperCase(),
                        routePath: x.routePath,
                        controllerName: x.Controller.name,
                        actionName: x.actionName,
                        filePath: x.controllerFile,
                        injectedServices: x.inject.map(j => getService(j, services))
                }));

    return routes;                    
}

function getService(key, services) {

    let k = key.replace(/^@+/, '');

    let service = services.find(s => s.key.toLowerCase() == k.toLowerCase());

    let routeScope = !service.singleton && key.startsWith('@@');
    let singleton = service.singleton || (!routeScope && key.startsWith('@'));
    let prototype = !routeScope && !singleton;

    let r = {
        key: k,
        routeScope,
        singleton,
        prototype
    }

    setInjectLifetime(r);

    return r;
}

function getServiceDependencies(service) {

    let result = [];
    var r;

    for (let key of service.servicesSingleton.keys()) {

        r = {
            key,
            singleton: true,
        }

        setInjectLifetime(r);

        result.push(r);
    }

    for (let key of service.servicesPrototype.keys()) {

        r = {
            key,
            prototype: true
        };

        setInjectLifetime(r);

        result.push(r);
    }

    return result;
}

function getServices(ctx) {

    const services = 
             [...ctx.route.serviceMap.keys()]
                .map(x => {

                    let val = ctx.route.serviceMap.get(x);
                    
                    return { 
                        key: x,
                        serviceFile: val.serviceFile,
                        serviceName: val.Class.name,
                        singleton: val.singleton,
                        filePath: val.serviceFile,
                        injectedServices: getServiceDependencies(val)
                    };
                });

    return services;                    
}

function setInjectLifetime(options) {

    if (options.routeScope) {
        options.lifetime = 'Route scoped';
    }
    else if (options.singleton) {
        options.lifetime = 'Singleton';
    }
    else if (options.prototype) {
        options.lifetime = 'Prototype';
    }
}
