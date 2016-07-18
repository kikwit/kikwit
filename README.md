[![Kikwit][kikwit-image]][kikwit-url]
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Build Status][travis-image]][travis-url]

Modern and fast web framework for nodejs. 

### Quick Start
We recommend the [Official Yo Generator](https://github.com/kikwit/generator-kikwit) for generating new applications.
```
# Create a folder for your project
mkdir /path/to/my/project
# Change to your project folder
cd /path/to/my/project
# Install yo and kikwit generator
npm install yo generator-kikwit -g
# Generate application
yo kikwit
# Launch
npm start 
# With the above command the application will listen on port 3000 by default. 
# The port can be changed in the __APP_ROOT/config.*.js__ environment specific configuration files.

# Point your browser to http://locahost:3000/home/index
```

### Features
* Modern framework. ES2015, ES2016 support (uses Babel)
* Awesome routing, versioned routes
* High performance
* HTTP response helpers
* Extendended view engines support
* Content negotiation
* Version negotiation
* Modern middlewares support using decorators
* Connect/Express middleware support
* Static files serving
* Conditional requests handling
* Available yeoman generator

### Benchmarks

![Benchmarks](https://raw.githubusercontent.com/kikwit/benchmarks-kikwit/master/benchmarks-nodejs-frameworks.png)

(Run on Ubuntu 16.04 LTS 64-bit, Intel® Core™ i7 CPU @ 2.40GHz × 8, 8 GiB RAM, No cluster, NodeJS v6.2.0)

[Benchmark code here](https://github.com/kikwit/benchmarks-kikwit)

### Controllers

By default controller classes are located in `APP_ROOT/controllers/**/*` where `APP_ROOT` is the application base folder. The location can be changed using the `controllersRoot` configuration key.
All controller classes must be decorated with `@controller`.

Example:
```javascript
import { controller } from 'kikwit';

@controller
export default class Products {
    ...
}
```
### Actions

Controller methods decorated with at least one HTTP method decorator are treated as actions.
HTTP method decorators specifiy which HTTP request methods are valid for an action. 

Example:
```javascript
import { controller, get, post } from 'kikwit';

@controller
export default class Products {

    @get
    list(ctx) {
        ...
    }
    
    @post
    add(ctx) {
        ...
    }    
}

```

An action can be decorated by more than one HTTP method decorator.
```javascript
import { controller, post, put } from 'kikwit';

@controller
export default class Products {

    @post
    @put
    edit(ctx) {
        ...
    }
}
```

The `@all` decorator makes the decorated action valid for any HTTP request method.

####List of supported decorators

|Decorator|HTTP Method       |
|---------|------------------|
|@all     |* `(Any method)`|
|@del     |DELETE            |
|@get     |GET               |
|@head    |HEAD              |
|@options |OPTIONS           |
|@post    |POST              |
|@put     |PUT               |

### Routing

Kikwit supports both explicit and implicit routing.

#### Explicit routing

Explicit routing is when a controller or action is tagged with a `@route` decorator.

Example:
```javascript
import { controller, get, route } from 'kikwit';

@route('/prods')
@controller
export default class Products {

    @route('/catalogue')
    @get
    list(ctx) {
        ...
    }
}
```
In the example above, the route url generated for the `list` action is `/prods/catalogue`. 

#### Implicit routing

Implicit routing is when a controller or action is not tagged with a `@route` decorator.

Example:
```javascript
import { controller, get } from 'kikwit';

@controller
export default class Products {

    @get
    list(ctx) {
        ...
    }
}
```
In the example above, the route url generated for the `list` action is `/products/list`. 

#### Route parameters

Routes can define dynamic parts in the following format `:KEY` where _KEY_ is the key used to access the corresponding value from the context.

Example
```javascript
import { controller } from 'kikwit';

@controller
export default class Products {

    @route('/show/:id')
    @get
    details(ctx) {
        ctx.send(ctx.params.id);
    }
}
```
With the route above, a`GET /products/show/34` request will result in a context param's id of _34_.

Route parameters can use regular expressions as constraints in the following format `:KEY<REGEX>` where _REGEX_ is the regular expression constraint.

In the example above, if the request was `GET /products/show/laptop` then the `ctx.params.id` would have been equal to _laptop_. But if the action route was 

`@route('/show/:id<\\d+>')` instead then `GET /products/show/laptop` request would have not been routed to the `details` action. 

Route parameters can also be specified on the controller level route decorator.

#### Route names

Action routes can specify a route name which helps generate URLs targeting the route. 

Example:
```javascript
import { controller } from 'kikwit';

@controller
export default class Products {

    @route('/show/:id', 'productDetails')
    @get
    details(ctx) {
        ctx.send(ctx.params.id);
    }
}
```
The context's `routeURL(name [, params] [, query] [, validate = true])` method can be called to generate the URL.

i.e. a link to the details action's route can be generated using the following
```
ctx.routeURL('productDetails', { id: 34 })
```
The above would generate the string _/products/show/34_.

Query strings can be added to the generated URL with the help of the third argument of the context's `routeURL(...)` method.
```
ctx.routeURL('productDetails', { id: 34 }, { offset: 10, pageSize: 20})
```
The above would generate the string _/products/show/34?offeset=10&pageSize=20_.

The _validate_ argument validates params values against route constraints (if any). Passing `false` skips any validation. 

### Context object

Controller actions and all interceptors accept a single context argument which provides the following properties and methods:

- **host**
  
  The request HOST header, or `X-FORWARDED-HOST` request header value (if present) when `trustProxy` setting is set to `true`, plus the port number.

- **hostname**
  
  The request HOST header, or `X-FORWARDED-HOST` request header value (if present) when `trustProxy` setting is set to `true`.
  
- **ip**
  
  The request client ip address, or the first entry from `X-FORWARDED-FOR` request header value (if present) when `trustProxy` setting is set to `true`.

- **ips**
  
  An array containing the request client ip address, or the all entries from `X-FORWARDED-FOR` request header value (if present) when `trustProxy` setting is set to `true`.
  
- **logger**
  
    The logger specified in the configuration file. If no logger is prvided then, when the environment is `development`, `ctx.logger` will point to the `console`.  
  
- **state**

    The state holds request data that are available to interceptors, action and views. Values stored in the `state` property are specific to the current request only.  
      
- **port**
  
    The request port number, or `X-FORWARDED-PORT` request header value (if present) when `trustProxy` setting is set to `true`.
  
- **protocol**
  
    The request protocol (http or https), or `X-FORWARDED-PROTO` request header value (if present) when `trustProxy` setting is set to `true`.
    
- **subdomains**
  
    An array containing the request subdomains. By default the domain is the last two parts of the host. The `subdomainOffset` configuration setting can be used to specify the number of parts that constitutes the application domain. The remaining parts are the subdomains.
    
    e.g. for `user.api.kikwitjs.com` the subdomain would be ['api', 'user'] if `subdomainOffset` configuration setting is 2 (default) and ['user'] if it's set to 3.
  
- **statusCode**
  
    Sets the response status code.
  
- **statusMessage**
  
    Sets the response status message.
     
- **download(path [, filename], [contentType] [, options])**
  
    Sends the contents of the file at path to for download. 
    
    The base name of the path argument is used as default value for the `Content-Disposition` header `filename` value unless `filename` 
    argument is specified.`Content-Disposition` header is set to `attachment` unless already set by the calling code.
    
    The response content type is derived from the file extension but an explicit value can be specified using the `contentType` argument.
    
    The optional `options` argument can specify the following:
    
    - __lastModified__: if `true`, set the `Last-Modified` header to the file's last modified time.
    
    - __root__: the root folder containing `path`. 
        
        If `root` is provided then `path` is always treated as relative.
        
        If `root` is not provided and `path` is not absolute then `root` defaults to the application root folder.   
            
    - __headers__: additional headers to add to the response.
        
        If `headers` is an object then its keys are used as header names and the corresponding values as header values.
        
        If `headers` is a function then it's called with a single argument representing the full path of the file and 
        any returned object is used to generate additional headers.
        
- **next()**
  
    Calls the next interceptor if any. When called in the last `@before` interceptor, this method will call the target action. If called in the last `@after` interceptor, the call does nothing.
    
    The `next()` valid to call in interceptors only.
   
- **redirect(url [, statusCode])**
  
    Redirects the request by setting a `LOCATION` header.
    
    The `statusCode` argument defaults to 302.
  
  
- **send(body [, contentType])**
  
    Sends the response using `body`, converted to string, as content. 
    
    The `contentType` argument, if not provided, defaults to `text/plain; charset=utf-8`.
  
  
- **sendJSON(body)**
  
    Sends a JSON response using `body` as content.
    
    The `CONTENT-TYPE` header, if not set by the calling code, is set to `application/json`.
  
  
- **sendJSONP(body)**
  
    Sends a JSON response with JSONP support.
    
    The default JSONP callback name is callback and can be changed using `json.callbackParam` configuration value.
  
  
- **sendFile(path, contentType, options)**
  
    Pipes the contents of the file at path to the response stream. 
    
    The response content type is derived from the file extension but an explicit value can be specified using the `contentType` argument.
    
    The optional `options` argument can specify the following:
    
    - __lastModified__: if `true`, set the `Last-Modified` header to the file's last modified time.
    
    - __root__: the root folder containing `path`. 
        
        If `root` is provided then `path` is always treated as relative.
        
        If `root` is not provided and `path` is not absolute then `root` defaults to the application root folder.
    
    - __headers__: additional headers to add to the response.
        
        If `headers` is an object then its keys are used as header names and the corresponding values as header values.
        
        If `headers` is a function then it's called with a single argument representing the full path of the file and any returned object is used to generate additional headers.
        
- **removeHeader(name)**
  
    Removes a response header.
     
- **setHeader(name, value)**
  
    Sets a response header. 
  
- **setHeaders(headers = {})**
  
    Sets response headers. 
    
    The `headers` argument can be a `Map` or an plain object.
  
- **skipToAction()**
  
    Skips any remaining `@before` interceptors, if any, and calls the target action.
    
    The `skipToAction()` valid to call in `@before` interceptors only.
   
- **stream(stream, contentType)**
  
    Pipes `stream` to the response steam.
    
    The `contentType` defaults to `application/octet-stream`
   
  
- **render([viewPath] [, locals] [, contentType])**
  
    Renders a view template.
    
    The optional `locals` argument are provided as the view model.
    If `viewPath` is not provided the view is looked up based on the controller and action name.
    The default is to look respectively in the follwing folders:

    1. __APP_ROOT/views/[CONTROLER_NAME]/[ACTION_NAME]__
    2. __APP_ROOT/views/[CONTROLER_NAME]__
    3. __APP_ROOT/views__.        
    
    The `views.root` configuration property defines the root folder for views 
    and defaults to __APP_ROOT/views__ where __APP_ROOT__ is the application's root folder.
    
- **routeURL(name [, params] [, query] [, validate = true])**
  
    Generates a url based on a route `name`. 
    
    The `params` header argument specifies any route parameter values. 
    
    `query` represents an object whose property names are added as the query string keys and corresponding values as query string values.
    
    The `validate` argument indicates whether the route parameters are checked against related patterns if any.

-- **throw(err)**

   Sends a response with a 500 status code and status text set to `err.message`.
   When the environement is `development` the error stack trace is also included.
   
   You can set the environment using `NODE_ENV` environment variable, e.g. `NODE_ENV=development` or `NODE_ENV=production`.

### Interceptors

Interceptors are middlewafunctions that are configured to run before or after an action. 
They can be used for logging, authorization, etc...

Kikwit supports defining interceptors using decorators on the controller or action levels.
Controller interceptors apply to all controller actions. Action interceptors apply to the decorated action only.

Interceptors have the same signature as controller actions, they accept a single Context argument.   

#### Before interceptors

Before interceptors are specified using the `@before` decorator. 

```javascript
import { before, del, get, inject } from 'kikwit';

@inject('myService')
@before(Products.authenticate)
export default class Products {
    
    @get
    list(ctx) {
        
        ctx.services.myService.getProducts().then(products => {
            
           ctx.sendJSON(products); 
        });
    }
    
    @before(Products.authorize) 
    @del
    deleteProduct(ctx) {

        ctx.services.myService.deleteProduct(ctx.params.id).then(() => {
                  
           ctx.sendJSON(ctx.locals.userAuth); 
        });
    }
    
    @before(Products.authorize) 
    @post
    updateProduct(ctx) {

        ctx.services.myService.updateProduct(ctx.body.product).then(() => {
                  
           ctx.sendJSON(ctx.locals.userAuth); 
        });
    }  
    
    @before(ctx => {})
    hello() {
    
        ctx.send('Hello World!');
    }
    
    static authenticate(ctx) {
        
        ctx.locals.userAuth = Math.random();        
        ctx.next();
    }  
    
    static authorize(ctx) {
        
        if (!ctx.locals.userAuth) {
            return ctx.sendStatus(403);
        }
        
        ctx.next();
    } 
}
```

#### After interceptors

After interceptors are specified using the `@after` decorator. 

```javascript
import { after, get, inject } from 'kikwit';

@inject('myService')
@after(Products.addRandomHeader)
export default class Products {

    @get
    list(ctx) {
        
        ctx.services.myService.getProducts().then(products => {
           // HTTP response will contain an 'X-RANDOM-NUMBER' header 
           ctx.sendJSON(products); 
        });
    }
    
    @get
    hello(ctx) {
        // HTTP response will contain an 'X-RANDOM-NUMBER' header 
        ctx.send('Hello'); 
    }
    
    static addRandomHeader(ctx) {
        
        ctx.setHeader('X-RANDOM-NUMBER', Math.random().toString());       
        ctx.next();
    }  
}
```
#### Connect/Express middleware support

Connect/Express middlewares are supported via the `@use` decorator. 
```javascript
const requestStamp = (req, res, next) => {
  req.stamp = Date.now();
  next();
};

@use(requestStamp)
export default class Products {

    @get
    list(ctx) {
    
        // ctx.request.stamp is set
        ctx.send('List');
    }
    
    @get
    details(ctx) {
        
        // ctx.request.stamp is set
        ctx.send('Details');
    }    
}
```
Please always use the `Context` helper methods when possible and avoid accessing the underlying request and response objects directly.

### Services

By default service classes are located in `APP_ROOT/services/**/*` where `APP_ROOT` is the application base folder. The location can be changed using the `servicesRoot` configuration key.
All service classes must be decorated with the `@service` decorator.
The `@service` requires a string argument which defines the key to use when injecting the service using the `@inject([KEY])` decorator. 
By default each request gets its own instance of the injected service.

Example:
```javascript
import { service } from 'kikwit';

@service('adder')
export default class Adder {
    
    add(a, b) {
        return a + b;
    }
}
```
```javascript
import { controller } from 'kikwit';

@inject('adder')
@controller
export default class Arithm {
    
    sum(ctx) {
        
        let a, b = [7, 11];
        let sum = ctx.services.adder.add(a, b); // ctx.services.adder from @inject('adder')
      
        return ctx.sendJSON({ a, b, sum });
    }
}
```

It is possible to get a service injected as a singleton by prefixing the key passed to the `@inject([KEY])` decorator with `@`.

Example:
```javascript
import { service } from 'kikwit';

@service('adder')
export default class Adder {
    
    add(a, b) {
        return a + b;
    }
}
```
```javascript
import { controller } from 'kikwit';

@inject('@adder') // '@adder' instead of 'adder'
@controller
export default class Arithm {
    
    sum(ctx) {
        
        let a, b = [7, 11];
        let sum = ctx.services.adder.add(a, b); // ctx.services.adder from @inject('@adder')
      
        return ctx.sendJSON({ a, b, sum });
    }
}
```

It is also possible to get the same instance of a service injected into an action across multiple requests by prefixing the key passed to the `@inject([KEY])` decorator with `@@`.

Example:
```javascript
import { service } from 'kikwit';

@service('adder')
export default class Adder {
    
    add(a, b) {
        return a + b;
    }
}
```
```javascript
import { controller } from 'kikwit';

@controller
export default class Arithm {
    
    @inject('@@adder') // '@@adder' instead of 'adder'
    sum(ctx) {
        
        let a, b = [7, 11];
        let sum = ctx.services.adder.add(a, b); // ctx.services.adder from @inject('@@adder')
      
        return ctx.sendJSON({ a, b, sum });
    }
}
```
In the example above, the instance injected into the `sum` action will only be reused by request to the `sum` action only.

To restrict a service to always be injected as a singleton, please pass `true` as a second argument to `@service([KEY], [SINGLETON])` decorator.

Example:
```javascript
import { service } from 'kikwit';

@service('adder', true)
export default class Adder {
    
    add(a, b) {
        return a + b;
    }
}
```
In the example above `Adder` will always get injected as a singleton regardless of how the format of the key used at the injection point.

Services injected at controller level are available to all of controller's actions.

### Cookies

### Error handling

An error handler can be specified using the `@onError` decorator. The error that was raised is accessible via the `Context.error` property.
```javascript
@onError(errorHandler)
export default class Products {

    @get
    list(ctx) {
    
        const nothing = null;
        
        ctx.send(nothing.toString());
    }
    
    @get
    details(ctx) {
        
        const a = null;
        const result = a.startsWith('b');

        ctx.send('Unreachable');
    } 
    
    // The following handler will be called when an exception in raised in list or details actions 
    static errorHandler(ctx) {
    
        // log ctx.error
        
        ctx.render('niceErrorPage', ctx.error);
    }
}
```

### Logging

### Prerequisites
* Node.js >= 6.0.0

### Tests

`npm test`

### Issue Submission

### Feature Requests

### Maintainers

* Elondo Mbonze

### Licence
[AGPL-3.0](https://opensource.org/licenses/AGPL-3.0)

[kikwit-image]: https://cloud.githubusercontent.com/assets/16418235/14813868/a6a33952-0b9b-11e6-8d2e-d7651b3ebdb3.png
[kikwit-url]: https://github.com/kikwit/kikwit
[npm-image]: https://img.shields.io/npm/v/kikwit.svg
[npm-url]: https://www.npmjs.com/package/kikwit
[node-version-image]: https://img.shields.io/node/v/kikwit.svg
[node-version-url]: http://nodejs.org/download/
[downloads-image]: https://img.shields.io/npm/dm/kikwit.svg
[downloads-url]: https://npmjs.org/package/kikwit
[travis-image]: https://travis-ci.org/kikwit/kikwit.svg?branch=master
[travis-url]: https://travis-ci.org/kikwit/kikwit
