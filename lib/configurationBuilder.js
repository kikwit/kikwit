import fs from 'fs';
import os from 'os';
import path from 'path';

import * as serviceResolver from './serviceResolver';

const baseConfigProp = Symbol();
const configProp = Symbol();
const servicesProp = Symbol();

export default class ConfigurationBuilder {

    constructor(baseConfig, services) {

        this[baseConfigProp] = baseConfig;
        this[configProp] = {};
        this[servicesProp] = services;
    }

    get environment() {

        return this[baseConfigProp].environment;
    }

    isEnvironment(env) {

        return this.environment.toLowerCase() == (env || '').toLowerCase();
    }

    addService(key) {

        let service;

        try {

            service = serviceResolver.resolve(key, this[configProp], this[servicesProp]);

            if (service && (typeof service.configuration) == 'object') {

                this[baseConfigProp].mergeRecursive(this[configProp], service.configuration);
            }

        } catch (err) {
            console.warn(`Coud not resolve service [${key}]`);
        }

        return this;        
    }

    addUserConfig() {

        const applicationId = process.env.npm_package_config_applicationId;

        if (!applicationId || !applicationId.trim()) {
            throw new Error('Required [applicationId] config key not specified in package.json file.');
        }

        const filePath = getUserConfigFilePath(applicationId, this[baseConfigProp].environment);

        if (filePath) {
            this.addJsonFile(filePath, true);  
        }

        return this;
    }

    addEnvironmentVariables(prefix) {

        let variablesMap = getEnvironmentVariables(prefix);

        let data = {};

        for (let key of Object.keys(variablesMap)) {

            setObjectProperty(data, key, variablesMap[key]);
        }

        this[baseConfigProp].mergeRecursive(this[configProp], data);

        return this;
    }

    addJsonFile(filePath, optional = false) {

        let fileContent;

        try {

            fileContent = fs.readFileSync(filePath, 'utf-8');

            if (fileContent && fileContent.trim()) {

                const data = JSON.parse(fileContent);

                this[baseConfigProp].mergeRecursive(this[configProp], data);
            }            

        } catch (err) {
            
            if (!optional || err.code != 'ENOENT') {
                throw err;
            }
        }

        return this;
    }

    merge(data) {

        this[baseConfigProp].mergeRecursive(this[configProp], data);

        return this;
    }

    set(data) {

        this[configProp] = data;

        return this;
    }

    get() {

        return this[configProp];
    }

    finalize() {

        this[baseConfigProp].mergeRecursive(this[baseConfigProp], this[configProp]); 

        this[configProp] = {};
    }
}

function getUserConfigFilePath(applicationId, environment) {

    let filePath;

    if (os.platform() == 'win32') {
        filePath = path.join(process.env.APPDATA, 'kikwit');
    } else {
        filePath = path.join(process.env.HOME, '.kikwit');
    }

    filePath = path.join(filePath, 'config', environment, applicationId, 'user-config.json');

    try {

        fs.accessSync(filePath);

        return filePath;

    } catch (err) {

        if (err.code == 'ENOENT') {
            return null;
        }

        throw new Error('Error accessing user config file:', err.message);
    }
}

function getEnvironmentVariables(prefix) {

    if (prefix) {

        prefix = prefix.trim().toLowerCase();

        if (prefix) {

            const variableMap = {};
            let variable;

            for (let key of Object.keys(process.env)) {

                if (key.toLowerCase().startsWith(prefix)) {
                    
                    variable = key.slice(prefix.length);

                    variableMap[variable] = process.env[key];
                }
            }

            return variableMap;
        }
    }

    return process.env;
}

function setObjectProperty(obj, key, value) {

    const props = key.split('__');
    const propsCount = props.length;

    for (let [index, prop] of props.entries()) {

        if (index == propsCount - 1) {

            obj[prop] = value;
            break;
        } 
        
        if (obj[prop] == null || !(obj[prop] instanceof Object)) {

            obj[prop] = {};
        }

        obj = obj[prop];
    };
}
