'use strict';

import fs from 'fs';
import path from 'path';

import Promise from 'bluebird';

export default class ViewResolver {

    constructor(environment) {

        this.environment = environment;
        
        if (this.environment != 'development') {
            this.pathsMap = new Map();            
        }
    }

    resolvePath(ctx, viewPath, locals, contentType) {

        let resolvedPath;

        if (viewPath) {
            resolvedPath = viewPath.trim();
        }

        const pathSeparator = '/';

        if (!resolvedPath) {

            resolvedPath = ctx.controllerBasename + pathSeparator + ctx.actionName;

        } else if (!resolvedPath.includes(pathSeparator) && !resolvedPath.includes('\\')) {

            resolvedPath = ctx.controllerBasename + pathSeparator + resolvedPath;
        }

        const pathKey = resolvedPath;

        let result = this.pathsMap && this.pathsMap.get(pathKey);

        if (result) {
            return result;
        }

        const viewsSettings = ctx.config.views;
        let viewEngine;

        if (viewsSettings.engines) {
            
            const extname = path.extname(resolvedPath);
            let viewEngineKey;

            if (extname) {

                viewEngineKey = extname.slice(1);
                viewEgine = viewsSettings.engines[viewEngineKey];

            } else {

                viewEngineKey = viewsSettings.defaultEngine;

                const viewEngineKeys = Object.keys(viewsSettings.engines);

                if (viewEngineKey && viewEngineKeys.indexOf(viewEngineKey) >= 0) {
                    resolvedPath += '.' + viewEngineKey;
                } else if (viewEngineKeys.length == 1) {
                    resolvedPath += '.' + viewEngineKeys[0];
                }

                viewEngine = viewsSettings.engines[viewEngineKey];
            }
        }

        if (!viewEngine) {
            throw new Error(`View engine not found. View path: [${resolvedPath}]`);
        }

        resolvedPath = viewsSettings.root + pathSeparator + resolvedPath;
        
        const visitedPaths = [];
        
        const viewExists = this.viewExists(viewsSettings.root, resolvedPath, visitedPaths);
        
        if (!viewExists) {   
            throw new Error(`View not found. Paths checked: ${visitedPaths}`);
        }

        result = { resolvedPath: visitedPaths.pop(), viewEngine };

        this.pathsMap && this.pathsMap.set(pathKey, result);

        return result;
    }

    renderTemplate(engine, viewPath, locals) {

        return new Promise((resolve, reject) => {

            engine(viewPath, locals, (err, content) => {

                if (err) {
                    return reject(err);
                }

                resolve(content);
            })
        });
    }
    
    viewExists(viewsRoot, resolvedPath, visitedPaths) {
        
        while (true) {

            try {
                
                visitedPaths.push(resolvedPath);
                
                fs.statSync(resolvedPath);    
                return true;
                
            } catch (ex) {
                
                let dirname = path.dirname(resolvedPath);
                
                if (!dirname || viewsRoot == dirname) {
                    return false;
                }
                
                resolvedPath = path.join(path.dirname(dirname), path.basename(resolvedPath));
                
                return this.viewExists(viewsRoot, resolvedPath, visitedPaths);
            }
        }
    }
}