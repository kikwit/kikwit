'use strict';

import * as helpers from './support/helpers'

import ViewResolver from '../lib/viewResolver'

beforeEach(() => {
    jasmine.addMatchers(helpers.customMatchers);
});

describe('ViewResolver', () => {
	
	describe('constructor', () => {
        
        it('should set the environment', () => {
            
            const environment = Math.random().toString();
            const viewResolver = new ViewResolver(environment);
            
            expect(viewResolver.environment).toBe(environment);            
        });
        it('should not set the pathsMap when environment is development', () => {
            
            const environment = 'development';
            const viewResolver = new ViewResolver(environment);
           
            expect(viewResolver.pathsMap instanceof Map).toBe(false);            
        }); 
        it('should set the pathsMap when environment is not development', () => {
            
            const environment = Math.random().toString();
            const viewResolver = new ViewResolver(environment);
           
            expect(viewResolver.pathsMap instanceof Map).toBe(true);            
        });         
    });
    
	describe('resolvePath', () => {
        
    });

	describe('renderTemplate', () => {
        
    });  
    
	describe('viewExists', () => {
        
    });            
});
    