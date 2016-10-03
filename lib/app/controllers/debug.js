import fs from 'fs';

import mustache from 'mustache';

const viewsRoot = './node_modules/kikwit/lib/app/views';

export default class Debug {
     
    overview(ctx) {
    
        const template = fs.readFileSync(`${viewsRoot}/Debug/overview.mustache`, 'utf-8');
        const header = fs.readFileSync(`${viewsRoot}/Debug/_header.mustache`, 'utf-8');
        const footer = fs.readFileSync(`${viewsRoot}/Debug/_footer.mustache`, 'utf-8');

        const model = {
            routes: getRoutes(ctx),
            services: getServices(ctx)
        };
        
        const output = mustache.render(template, model, { header, footer });

        ctx.send(output, 'text/html');
    }
}

function getRoutes(ctx) {

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
                        injectedServices: x.inject      
                }));

    return routes;                    
}

function getServices(ctx) {

    const services = 
             [...ctx.route.serviceMap.keys()]
                .map(x => {

                    let val = ctx.route.serviceMap.get(x);
                    let svc = { 
                        key: x,
                        serviceFile: val.serviceFile,
                        serviceName: val.Class.name,
                        singleton: val.singleton,
                        filePath: null,
                        injectedServices: val.inject
                    };

                    return svc;
                });

    return services;                    
}
