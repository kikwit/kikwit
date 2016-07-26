import fs from 'fs';

import mustache from 'mustache';

const viewsRoot = './node_modules/kikwit/lib/app/views';

export default class Debug {
     
    routes(ctx) {
        
        const viewContent = fs.readFileSync(`${viewsRoot}/Debug/routes.mustache`, 'utf-8');
        const model = {
            routes: ctx.routes
                        .sort((x, y) => x.routePath.toLowerCase() > y.routePath.toLowerCase())
                        .filter(x => !x.routePath.startsWith('/_debug/'))
                        .map(x => ({
                                        httpMethods: x.httpMethods.join(', ').toUpperCase(),
                                        routePath: x.routePath,
                                        consumes: x.consumes,
                                        produces: x.produces,
                                        controllerName: x.Controller.name,
                                        actionName: x.actionName,
                                        controllerFile: x.controllerFile,
                                        services: x.inject      
                         }))
        };
        
        const output = mustache.render(viewContent, model);

        ctx.send(output, 'text/html');
    }
}
