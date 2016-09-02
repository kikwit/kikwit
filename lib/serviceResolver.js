

export function resolveDependencies(services) {

    let serviceEntry;
    let singletonScope;

    for (let [_, svcEntry] of services) {
        for (let key of svcEntry.inject) {

            singletonScope = false;

            if (key.startsWith('@')) {
                
                singletonScope = true;
                key = key.slice(1);
            }

            serviceEntry = services.get(key);

            if (!serviceEntry) {
                throw new Error(`Invalid dependency [${key}] for route [${route.routePath}]`)   
            }

            if (serviceEntry.singleton || singletonScope) {

                if (!serviceEntry.instance) {
                    serviceEntry.instance = new serviceEntry.Class();
                }

                svcEntry.servicesSingleton.set(key, serviceEntry.instance);

            } else {

                svcEntry.servicesPrototype.set(key, serviceEntry.Class);
            }
        }
    }
}

export function resolve(key, config, services) {

    let serviceEntry;
    let service;
    let singletonScope;

    singletonScope = false;

    if (key.startsWith('@@')) {

        return null;

    } else if (key.startsWith('@')) {

        singletonScope = true;
        key = key.slice(1);
    }

    serviceEntry = services.get(key);

    if (!serviceEntry) {
        return null;
    }

    if (serviceEntry.singleton || singletonScope) {

        if (!serviceEntry.instance) {
            serviceEntry.instance = new serviceEntry.Class();
        }

        service = serviceEntry.instance;

    } else {

        service = new serviceEntry.Class();
    }

    if (service.services == null) {
        resolveServiceDependencies(config, service, serviceEntry, services);
    }

    return service;
}

export function resolveServiceDependencies(config, service, serviceEntry, services, visited = new Set()) {

    service.services = {};
    service.config = config;

    for (let [key, svcSingleton] of serviceEntry.servicesSingleton) {

        service.services[key] = svcSingleton;
    }

    for (let [key, svcPrototype] of serviceEntry.servicesPrototype) {

        service.services[key] = new svcPrototype();
    }

    visited.add(service);

    let svc, svcEntry;

    for (let key of Object.keys(service.services)) {

        svc = service.services[key];

        if (visited.has(svc)) {
            continue;
        }

        svcEntry = services.get(key);

        resolveServiceDependencies(config, svc, svcEntry, services, visited);
    }
}
