import fs from 'fs';

import mustache from 'mustache';

const viewsRoot = './node_modules/kikwit/lib/app/views';

export default class Debug {
     
    routes(ctx) {
        
        const viewContent = fs.readFileSync(`${viewsRoot}/Debug/routes.mustache`, 'utf-8');
        const model = {
            routes: ctx.routes.filter(x => !x.routePath.startsWith('/_debug/')).map(x => ({
                httpMethods: x.httpMethods.join(', '),
                routePath: x.routePath,
                controllerName: x.Controller.name,
                actionName: x.actionName        
            }))
        };
        
        const output = mustache.render(viewContent, model);

        ctx.send(output, 'text/html');
    }
}
