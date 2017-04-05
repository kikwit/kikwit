
[![Kikwit][kikwit-image]][kikwit-url]

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Build Status][travis-image]][travis-url]

Modern and fast web framework for nodejs.

### Quick Start
We recommend the [Official Yo Generator](https://github.com/kikwit/generator-kikwit) for generating new applications.
```bash
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
# The port can be changed in your configuration settings.

# Point your browser to http://locahost:3000/home/index
```

### Features

* Modern framework. ES2015, ES2016 support (uses Babel)
* Awesome routing
* High performance
* HTTP response helpers
* Extended view engines support
* Content negotiation
* Modern middlewares support using decorators
* Connect/Express middleware support
* Seamless Websockets and Server-sent events support
* Conditional requests handling
* Available yeoman generator

### Benchmarks

![Benchmarks](https://raw.githubusercontent.com/kikwit/benchmarks-kikwit/master/benchmarks-nodejs-frameworks.png)

(Benchmarked on Ubuntu 16.10 LTS 64-bit, Intel® Core™ i7 CPU @ 2.40GHz × 8, 8 GiB RAM, No cluster, NodeJS v7.2.0)

[Benchmark code here](https://github.com/kikwit/benchmarks-kikwit)

### Controllers

By default controller classes are located in `APP_ROOT/controllers/**/*` where `APP_ROOT` is the application base folder. The location can be changed using the `controllersRoot` configuration property.
All controller classes must be decorated with `@controller`.

```javascript
import { controller } from 'kikwit';

@controller
export class Products {
    ...
}
```
### Actions

Controller methods decorated with at least one HTTP method decorator are treated as actions.
HTTP method decorators specifiy which HTTP request methods are valid for an action. 

```javascript
import { controller, get, post } from 'kikwit';

@controller
export class Products {

    @get
    list(context) {
        ...
    }
    
    @post
    add(context) {
        ...
    }    
}

```

An action can be decorated by more than one HTTP method decorator.
```javascript
import { controller, post, put } from 'kikwit';

@controller
export class Products {

    @post
    @put
    edit(context) {
        ...
    }
}
```

The `@all` decorator makes the decorated action valid for any HTTP request method.

#### List of supported http methods

|Decorator          |HTTP Method                             |
|-------------------|----------------------------------------|
|@all               |* `(Any method)`                        |
|@acl               |ACL                                     |
|@baselineControl   |BASELINE-CONTROL                        |
|@checkin           |CHECKIN                                 |
|@checkout          |CHECKOUT                                |
|@copy              |COPY                                    |
|@del               |DELETE                                  |
|@get               |GET                                     |
|@head              |HEAD                                    |
|@label             |LABEL                                   |
|@lock              |LOCK                                    |
|@merge             |MERGE                                   |
|@mkactivity        |MKACTIVITY                              |
|@mkcol             |MKCOL                                   |
|@mkworkspace       |MKWORKSPACE                             |
|@move              |MOVE                                    |
|@options           |OPTIONS                                 |
|@orderpatch        |ORDERPATCH                              |
|@patch             |PATCH                                   |
|@post              |POST                                    |
|@propfind          |PROPFIND                                |
|@proppatch         |PROPPATCH                               |
|@put               |PUT                                     |
|@report            |REPORT                                  |
|@search            |SEARCH                                  |
|@trace             |TRACE                                   |
|@unlock            |UNLOCK                                  |
|@update            |UPDATE                                  |
|@versionControl    |VERSION-CONTROL                         |
|@uncheckout        |UNCHECKOUT                              |

### Routing

Kikwit supports both explicit and implicit routing.

#### Explicit routing

Explicit routing is when a controller or action is tagged with a `@route` decorator.

```javascript
import { controller, get, route } from 'kikwit';

@route('/prods')
@controller
export class Products {

    @route('/catalog')
    @get
    list(context) {
        ...
    }
}
```
In the example above, the `list` action will be accessible at `/prods/catalog`. 

#### Implicit routing

Implicit routing is when a controller or action is not tagged with a `@route` decorator.

```javascript
import { controller, get } from 'kikwit';

@controller
export class Products {

    @get
    list(context) {
        ...
    }
}
```
In the example above, the `list` action will be accessible at `/products/list`. 

#### Route parameters

Routes can define dynamic parts in the following format `:KEY` where _KEY_ is the key used to access the corresponding value from the request context.

```javascript
import { controller } from 'kikwit';

@controller
export class Products {

    @route('/show/:id')
    @get
    details(context) {
        context.send(context.params.id);
    }
}
```
With the route above, a `GET /products/show/34` request will result in a context params's id of _34_.

Route parameters can use regular expressions as constraints in the following format `:KEY<REGEX>` where _REGEX_ is the regular expression constraint.

Using the example above, if the request was `GET /products/show/laptop` then the `context.params.id` would be _laptop_. But if the action route was 

`@route('/show/:id<\\d+>')` instead then `GET /products/show/laptop` request would not be dispatched to the `details` action. 

Route parameters can also be specified on the controller level route decorator.

#### Route tokens

Tokens can be used to dynamically reference the controller and action names so you don't have to update
the route paths when they are renamed.

```javascript
import { controller, get, route } from 'kikwit';

@route('/api/[controller]')
@controller
export class Products {

    @route('/[action]/all')
    @get
    list(context) {
        context.send('Products list');
    }
}
```

The _list_ action can be accessed at `/api/products/list/all`.

#### Route names

Action routes can specify a route name which helps generate URLs targeting the route. 

```javascript
import { controller } from 'kikwit';

@controller
export class Products {

    @route('/show/:id', 'productDetails')
    @get
    details(context) {
        context.send(context.params.id);
    }
}
```
The context's `routeURL(name [, params] [, query] [, validate = true])` method can be called to generate the URL.

i.e. a link to the details action's route can be generated using the following
```
context.routeURL('productDetails', { id: 34 })
```
The above would generate the string _/products/show/34_.

Query strings can be added to the generated URL with the help of the third argument of the context's `routeURL(...)` method.
```
context.routeURL('productDetails', { id: 34 }, { offset: 10, pageSize: 20})
```
The above would generate the string _/products/show/34?offset=10&pageSize=20_.

The _validate_ argument validates params values against route constraints (if any). Passing `false` skips any validation. 

### Request Data

#### Query strings

Query strings values can be accessed using the `query` property of the request context.

```javascript
import { controller, get } from 'kikwit';

@controller
export class Page {

    @get
    echo(context) {
        
        const offset = context.query.offset;  
        const limit = Math.min(context.query.limit, 50);         
        const categories = context.query.categories;       

        context.sendJSON({ offset, limit, categories });
    }
} 
```

A `GET /page/echo?offset=15&limit=20&categories=laptop&categories=phablet` request to the `echo` action above will return the following JSON document

```javascript

{ offset: 15, limit: 20, categories: ['laptop', 'phablet'] }
```

By default the [querystring][querystring-package-url] package's [parse][querystring-package-parse-url] 
function is used to parse the query string. 
You can assign a global custom function for query parsing by setting the `queryParser` configuration property. 
This function should accept a string and return an object which will accessible via the Context's `query` property:

E.g.
```javascript
{
    ...,
    queryParser: querystring.parse,
    ...
}
```

When the `queryParser` configuration property is set to `false` the query string is not parsed at all and the `query` property is not set.

You also can also assign a custom parser to a specific controller or action only using the `@queryParser` decorator.

```javascript
import { controller, get, queryParser } from 'kikwit';

@controller
export class Page {

    @queryParser(myParser)
    @get
    echo(context) {
        
        const offset = context.query.offset;  
        const limit = Math.min(context.query.limit, 50);         
        const categories = context.query.categories;       

        context.sendJSON({ offset, limit, categories });
    }
} 

function myParser(str) {

    let [offset, limit, categories] = str.split('-');

    categories = categories.split(',');

    return { offset, limit, categories };
}
```

A `GET /page/echo?15-20-laptop,phablet` request 
to the `echo` action will return the following

```javascript

{ offset: 15, limit: 20, categories: ['laptop', 'phablet'] }
```

#### Request body

The body of the request can be accessed using the `body` property of the request context.

```javascript
import { controller, post } from 'kikwit';

@controller
export class User {

    @post
    register(context) {
        
        const username = context.body.username;  
        const gender = context.body.gender;      

        context.sendJSON({ username, gender });
    }
} 
```

The following request

`curl -X POST -F 'username=Shaka Zulu' -F 'gender=M' http://domain.tld/user/register`

will return

```javascript

{ username: 'Shaka Zulu', gender: 'M' }
```

|Request Content Type  |Default parser                          |
|----------------------|----------------------------------------|
|urlencoded            |Busboy                                  |
|multipart             |Busboy                                  |
|Text                  |None. `Context.body` is a `string`      |
|JSON                  |`JSON.parse`                            |
|_All others_          |None. `Context.body` is a `Buffer`      |

The body parser can be changed by setting a custom `bodyParser` configuration property.
This function should accept a request `Context` object and return a promise that resolves to an object 
containing two properties: `body` and `files`. 
The `files` property should represent the uploaded files is any.

E.g.
```javascript

import formidable from 'formidable';

{
    ...,
    bodyParser: myParser,
    ...
}

function myParser(context) {

    return new Promise((resolve, reject) => {

        var form = new formidable.IncomingForm();

        form.parse(context.request, function(err, fields, files) {

            if (err) {
                return reject(err);
            }

            return resolve({ body: fields, files });
        });
    }
}
```

When the `bodyParser` configuration property is set to `false` the body is not parsed at all and the `body` property is not set.

You also can also assign a custom parser to a specific controller or action only using the `@bodyParser` decorator.

```javascript
import { controller, post, bodyParser } from 'kikwit';

@controller
export class User {

    @bodyParser(myParser)
    @post
    register(context) {
        
        ...
    }
} 
```

### Context object

Controller actions and all interceptors accept a single request context argument which provides the following properties and methods:

- **config**

  The application configuration properties.
  
- **host**
  
  The request HOST header, or `X-FORWARDED-HOST` request header value (if present) when `trustProxy` setting is set to `true`, plus the port number.

- **hostname**
  
  The request HOST header, or `X-FORWARDED-HOST` request header value (if present) when `trustProxy` setting is set to `true`.
  
- **ip**
  
  The request client ip address, or the first entry from `X-FORWARDED-FOR` request header value (if present) when `trustProxy` setting is set to `true`.

- **ips**
  
  An array containing the request client ip address, or the all entries from `X-FORWARDED-FOR` request header value (if present) when `trustProxy` setting is set to `true`.
  
- **state**

    The state holds request data that are available to interceptors, action and views. Values stored in the `state` property are specific to the current request only.  
      
- **port**
  
    The request port number, or `X-FORWARDED-PORT` request header value (if present) when `trustProxy` setting is set to `true`.
  
- **protocol**
  
    The request protocol (http or https), or `X-FORWARDED-PROTO` request header value (if present) when `trustProxy` setting is set to `true`.
    
- **statusCode**
  
    Gets or sets the response status code.
  
- **subdomains**
  
    An array containing the request subdomains. By default the domain is the last two parts of the host. The `subdomainOffset` configuration property can be used to specify the number of parts that constitutes the application domain. The remaining parts are the subdomains.
    
    e.g. for `user.api.kikwitjs.com` the subdomain would be ['api', 'user'] if `subdomainOffset` configuration property is 2 (default) and ['user'] if it's set to 3.
    
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

- **noEvent(interval)**

    Signals that there is no server-sent event data to sends to the client.
        
    The _interval_ argument specifies the time interval to wait until the next call to generate another event.

- **redirect(url [, statusCode])**
  
    Redirects the request by setting a `LOCATION` header.
    
    The `statusCode` argument defaults to 302.
  
- **redirectToRoute(name, params, query = null, validate = true, statusCode = null)**

- **removeHeader(name)**
  
    Removes a response header.

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
           
- **send(body [, contentType])**
  
    Sends the response using `body`, converted to string, as content. 
    
    The `contentType` argument, if not provided, defaults to `text/plain; charset=utf-8`.
  
- **sendEvent(eventDetails, interval)**

    Sends a server-sent event.
        
    The _interval_ argument specifies the time interval to wait until the next call to generate another event.
    If there is no data to send then the Context's `noEvent(interval)` method should be called. 

    The _eventDetails_ argument should have the following properties:

    - `event`

        The event name. If this property is specified, an event will be dispatched on the browser to the listener for the specified event name; 
        This property corresponds to the [Server-sent events standard][server-sent-events-standard]'s _event_ field.
        The EventSource's `onmessage` handler is called if no event name is specified for a message.

    - `data`

        The data field for the message. When the caller's EventSource receives multiple consecutive lines that begin with `data:`,
        it will concatenate them, inserting a newline character between each one. Trailing newlines are removed.

        This field corresponds to the [Server-sent events standard][server-sent-events-standard]'s _data_ field.
    
    - `id`

        The event ID to set the caller's EventSource object's last event ID value.
        This field corresponds to the [Server-sent events standard][server-sent-events-standard]'s _id_ field.
    
    - `retry`

        The reconnection time to use when attempting to send the event. 
        This must be an integer, specifying the reconnection time in milliseconds.
        This field corresponds to the [Server-sent events standard][server-sent-events-standard]'s _retry_ field.

- **sendJSON(body)**
  
    Sends a JSON response using `body` as content.
    
    The `CONTENT-TYPE` header, if not set by the calling code, is set to `application/json`.
   
- **sendJSONP(body)**
  
    Sends a JSON response with JSONP support.
    
    The default JSONP callback name is callback and can be changed using `json.callbackParam` configuration property.
         
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

- **sendStatus(code, message)**

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
   
-- **throw(err)**

   Sends a response with a 500 status code and status text set to `err.message`.
   When the environement is `development` the error stack trace is also included.
   You can set the environment using `NODE_ENV` environment variable, e.g. `NODE_ENV=development` or `NODE_ENV=production`.

### Interceptors

Interceptors are middlere wafunctions that are configured to run before or after an action. 
They can be used for logging, authorization, etc...

Kikwit supports defining interceptors using decorators on the controller or action levels.
Controller interceptors apply to all controller actions. Action interceptors apply to the decorated action only.

Interceptors have the same signature as controller actions, they accept a single Context argument.   

#### Before interceptors

Before interceptors are specified using the `@before(...interceptors)` decorator.

```javascript
'use strict';

import { before, controller, get } from 'kikwit';

@before(authenticate) 
@controller
export class Home {

    @get
    index(context) {

        context.sendJSON(context.locals);     
    }

    @before(authorize) 
    @get
    details(context) {

        context.sendJSON(context.locals);
    }

    @before(authorize) 
    @get
    info(context) {

        context.sendJSON(context.locals);
    }  

    @before(greet, authorize)
    @get
    hello(context) {

        context.sendJSON(context.locals);
    }
}

function authenticate(context) {

    context.locals.userId = Math.trunc(Math.random() * 1000000);     

    context.next();
}  

function authorize(context) {

    context.locals.authorized = (context.locals.userId % 2 == 0);   

    if (!context.locals.authorized) {
        return context.sendStatus(403, JSON.stringify(context.locals));
    }

    context.next();
}

function greet(context) {

    context.locals.greeted = true;
    
    return context.skipToAction();
}  
```

#### After interceptors

After interceptors are specified using the `@after(...interceptors)` decorator. 

```javascript
import { after, get, inject } from 'kikwit';

@after(addRandomHeader)
export class Products {

    @inject('myService')
    @get
    list(context) {
        
        context.services.myService.getProducts().then(products => {
           // HTTP response will contain an 'X-RANDOM-NUMBER' header 
           context.sendJSON(products); 
        });
    }
    
    @get
    hello(context) {
        // HTTP response will contain an 'X-RANDOM-NUMBER' header 
        context.send('Hello'); 
    }
}

function addRandomHeader(context) {
    
    context.setHeader('X-RANDOM-NUMBER', Math.random().toString());       
    context.next();
}  
```
#### Connect/Express middleware support

Connect/Express middlewares are supported via the `use` helper function.
The `use` function transforms a middleware to a before interceptor.

```javascript
import { before, controller, get, use } from 'kikwit';

@before(use(requestStamp))
@controller
export class Products {

    @get
    list(context) {
    
        // context.request.stamp is set
        context.send('List');
    }
    
    @get
    details(context) {
        
        // context.request.stamp is set
        context.send('Details');
    }    
}

function requestStamp(req, res, next) {
  
    req.stamp = Date.now();
    next();
};
```
Please always use the `Context` helper methods when possible and avoid accessing the underlying request and response objects directly.

### Services

By default service classes are located in `APP_ROOT/services/**/*` where `APP_ROOT` is the application base folder. The location can be changed using the `servicesRoot` configuration property.
All service classes must be decorated with the `@service` decorator.
The `@service` requires a string argument which defines the key to use when injecting the service using the `@inject(...KEYS)` decorator. 
By default each request gets its own instance of the injected service.

```javascript
import { service } from 'kikwit';

@service('adder')
export class Adder {
    
    add(a, b) {
        return a + b;
    }
}
```
```javascript
import { controller } from 'kikwit';

@inject('adder')
@controller
export class Arithm {
    
    sum(context) {
        
        let [a, b] = [7, 11];
        let sum = context.services.adder.add(a, b); // context.services.adder from @inject('adder')
      
        return context.sendJSON({ a, b, sum });
    }
}
```

It is possible to get a service injected as a singleton by prefixing the key passed to the `@inject(...KEYS)` decorator with `@`.

```javascript
import { service } from 'kikwit';

@service('adder')
export class Adder {
    
    add(a, b) {
        return a + b;
    }
}
```
```javascript
import { controller } from 'kikwit';

@inject('@adder') // '@adder' instead of 'adder'
@controller
export class Arithm {
    
    sum(context) {
        
        let [a, b] = [7, 11];
        let sum = context.services.adder.add(a, b); // context.services.adder from @inject('@adder')
      
        return context.sendJSON({ a, b, sum });
    }
}
```

It is also possible to get the same instance of a service injected into an action across multiple requests by prefixing the key passed to the `@inject(...KEYS)` decorator with `@@`.

```javascript
import { service } from 'kikwit';

@service('adder')
export class Adder {
    
    add(a, b) {
        return a + b;
    }
}
```
```javascript
import { controller } from 'kikwit';

@controller
export class Arithm {
    
    @inject('@@adder') // '@@adder' instead of 'adder'
    sum(context) {
        
        let [a, b] = [7, 11];
        let sum = context.services.adder.add(a, b); // context.services.adder from @inject('@@adder')
      
        return context.sendJSON({ a, b, sum });
    }
}
```
In the example above, the instance injected into the `sum` action will only be reused by request to the `sum` action only.

To restrict a service to always be injected as a singleton, please pass `true` as a second argument to `@service([KEY], [SINGLETON])` decorator.

```javascript
import { service } from 'kikwit';

@service('adder', true)
export class Adder {
    
    add(a, b) {
        return a + b;
    }
}
```
In the example above `Adder` will always get injected as a singleton regardless of how the format of the key used at the injection point.

Services injected at controller level are available to all of controller's actions.

## Routes and services overview page

An overview of an application's routes and services can be accessed at `/_debug/overview` url path when running the application 
with the _development_ environment (default).
The overview page is not available with other environments.

![debug_overview-controllers](https://cloud.githubusercontent.com/assets/1747482/20391988/d40d138a-accd-11e6-9312-f5764d9677f6.png)

![debug_overview-services](https://cloud.githubusercontent.com/assets/1747482/20391989/d40ed828-accd-11e6-84f8-0b9cc49d16c5.png)

### Cookies

Kikwit supports cookies via the [cookies][cookies-package-url] package which optionally provides cookie signing, to prevent tampering, using the [keygrip][keygrip-package-url] package.

```javascript
import { controller, get } from 'kikwit';

@controller
export class Products {

    @get
    index(context) {
    
        context.cookies.set('unsigned', '12345');
        context.cookies.set('signed', '67890', { signed: true });
        
        context.redirect('/products/details');
    }
    
    @get
    details(context) {
        
        var unsigned = context.cookies.get('unsigned');
        var signed = context.cookies.get('signed', { signed: true });
        
        context.sendJSON({ unsigned, signed });
    } 
}
```

The keys used to sign the cookies can be set in the config file using the `cookieParser.keys` entry as follows:
```javascript
{
    ...
    cookieParser: {
        keys: ['~strong-key-01!', '#strong-key-02?']
    }
    ...
}
```

Cookie parsing can be disabled by setting the `cookieParser` to a falsy value.
```javascript
{
    ...
    cookieParser: null
    ...
}
```

Please refer to the [cookies][cookies-package-url] package for more info regarding additional features for cookies.

### Error handling

An error handler can be specified using the `@onError` decorator. The error that was raised is accessible via the `Context.error` property.
```javascript
import { controller, get, onError } from 'kikwit';

@onError(errorHandler)
@controller
export class Products {

    @get
    list(context) {
    
        const nothing = null;
        
        context.send(nothing.toString());
    }
    
    @get
    details(context) {
        
        const a = null;
        const result = a.startsWith('b');

        context.send('Unreachable');
    } 
}

// The following handler will be called when an exception in raised in list or details actions 
function errorHandler(context) {
    // log context.error
    context.render('niceErrorPage', context.error);
}
```

### WebSockets support

Annotating a controller with `@webSocket` decorator turns it into a WebSocket handler.
Controller class methods are automatically used as WebSocket events listeners when
they are annotated with the following decorators:

|Method       |Handled WebSocket event |Context body (`context.body`) |                                                                                      |
|-------------|------------------------|--------------------------|--------------------------------------------------------------------------------------|
|`@onClose`   |`close`                 |`{code, message}`         |Called when the connection is closed. code is defined in the WebSocket specification. |
|`@onConnect` |`connection`            |`undefined`               |Called when the connection is established.                                            |
|`@onMessage` |`message`               |`{data, flags}`           |Called when data is received. `flags` is an object with member binary.                |
|`@onPing`    |`ping`                  |`{data, flags}`           |Called when a ping is received. `flags` is an object with member binary.              |
|`@onPong`    |`pong`                  |`{data, flags}`           |Called when a pong is received. `flags` is an object with member binary.              |
 
```javascript

import { controller, webSocket, onConnect, onMessage, onClose } from 'kikwit';

@webSocket
@controller
export class Forum {  

    @onConnect
    join(context) {
    
        context.send(`Welcome ${context.query.username}!`);
    }
    
    @onMessage
    receive(context) {
    
        context.send(`You said: ${context.body.data}`);
    }    
    
    @onClose
    gone(context) {
    
        console.log(`${context.query.username} has gone`);
    }      
}
```

You can use a script similar to the following to call the above WebSocket controller from a web browser

```javascript

var ws = new WebSocket('ws://HOST[:PORT]/forum?username=mega-mind');

ws.onmessage = function(event) {
    
    console.log(event.data);
};

ws.send("I'm bored!");
```

The following Context methods are available on WebSocket controllers

|Context method                                       |Description                                                                                                                                                                                                                                   |
|-----------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`close([code], [data])`                              |Gracefully closes the connection, after sending a description message.                                                                                                                                                                        |
|`pause()`                                            |Pause the client stream.                                                                                                                                                                                                                      |  
|`ping([data], [options], [dontFailWhenClosed])`      |Sends a ping. `data` is sent, `options` is an object with members `mask` and `binary`. `dontFailWhenClosed` indicates whether or not to throw if the connection isn't open.                                                                   |
|`pong([data], [options], [dontFailWhenClosed])`      |Sends a pong. `data` is sent, `options` is an object with members `mask` and `binary`. `dontFailWhenClosed` indicates whether or not to throw if the connection isn't open.                                                                   |
|`resume()`                                           |Resume the client stream                                                                                                                                                                                                                      |
|`send(data, [options], [callback])`                  |Sends `data` through the connection. `options` can be an object with members `mask`, `binary` and `compress`. The optional `callback` is executed after the send completes.                                                                   |
|`stream([options], callback)`                        |Streams data through calls to a user supplied function. `options` can be an object with members `mask` and `binary`. `callback`, of the form `function (error, send)`, is executed on successive ticks of which `send` is `function (data, final)`.|
|`terminate()`                                        |Immediately shuts down the connection.                                                                                                                                                                      |

Behind the scenes, Kikwit uses the [ws][ws-package-url] package.

### Server-sent Events support

Sending a server-sent is as simple as calling `context.sendEvent(eventDetails, interval)`. 
Please see the [Context object](#context-object) for more details about the `sendEvent` method.  

```javascript

import { controller, get } from 'kikwit';

@controller
export class StockMarket {  
    
    @get
    ticker(context) {
        
        let lastEventId = context.lastEventId || 0;
        
        const randomValue = () => Number.parseFloat((Math.random()*2).toFixed(2)) * (Math.random() < 0.5 ? -1 : 1);
 
        const eventDetails = { 
            data: { 
                DJIA: randomValue(), 
                Nasdaq: randomValue(), 
                ['S&P 500']: randomValue(), 
                GOLD: randomValue() 
            }, 
            id: ++lastEventId, 
            event: 'tick',
            retry: 5000
        };
        
        context.sendEvent(eventDetails, 5000); 
    }      
}
```

The client call for the above would be something like

```javascript

var eventSrc = new EventSource('/stockmarket/ticker');

eventSrc.onmessage = function(event) {
    
    console.log(event.data);
}
```

### Static Files

Any files located under `APP_ROOT`/public are available to any user under the `/public/` path.
The directory for static files can be changed by setting the `staticFiles.root` configuration key.

For example, to set the static files folder to be served from a folder called _assets_ you can use the following configuration.
The configuration below exposes static files under `/assets/*`.
```javascript
    {
        staticFiles: {
            root: 'assets'
        }
    }
```

#### Directory browsing

Directory browsing allows users of your web app to see a list of directories and files within the static files folder.
Directory browsing is disabled by default. To enable directory browsing, set the `staticFiles.directoryBrowsing` 
configuration key. Setting it to `true` enables directory browsing for all static files directories.

```javascript
    {
        staticFiles: {
            directoryBrowsing: true
        }
    }
```

Secondly, `directoryBrowsing` can be set to an array of paths of the only folders to expose. 
In this case the paths are relative to and must be located under the `staticFiles.root` folder.
Any leading or trailing slashes are ignored.

```javascript
    {
        staticFiles: {
            directoryBrowsing: [ 'images/', 'scripts', '/styles' ] 
        }
    }
```

For more control, `directoryBrowsing` can be set to a predicate function that accepts
a folder path and returns true to allow browsing, or false to disable it.
The folder path is relative to the static folder path setting.
In the example below, only requested folders with names starting with `_` will be browsable.

```javascript
    {
        staticFiles: {
            directoryBrowsing: (folder) => folder.startsWith('_')
        }
    }
```

When `directoryBrowsing` is enabled for a folder, you can set an `indexFile` file to display when the user requests the directory.

```javascript
    {
        staticFiles: {
            directoryBrowsing: true,
            indexFile: 'index.html'
        }
    }
```

When the index file is not set, or when it cannot be found in the requested  directory,
an auto-generated file is used instead.
![directory-browser](https://cloud.githubusercontent.com/assets/16418235/22479623/5f59e60e-e7e6-11e6-8d4a-9d6052fbfa5c.png)

#### Custom HTTP headers

Custom headers can be added to static files responses using the `staticFiles.headers` configuration key.

To add headers using an object use the following:
```javascript
    {
        staticFiles: {
            directoryBrowsing: true,
            headers: {
                'SOME-HEADER': 'Value',
                'OTHER-HEADER': 'Other Value',
            },
        },
    }
```

Alternatively, a function can be added for more flexibility:
```javascript
    {
        staticFiles: {
            directoryBrowsing: true,
            headers: (file) => {
                // the [file] argument is the requested file path relative to the static files root.
                // Compute headers here, for example based of the type of [file].
                const hdrs = {
                    'SOME-HEADER': 'Value',
                    'OTHER-HEADER': 'Other Value',
                };

                return hdrs;          
            },
        },
    }
```

### HTTPS

To run the server over HTTPS, you need to set the `https` configuration property.
Internally, the `https` options are passed as first argument to node's `https.createServer(...)` function.
More details can be found [here][https-package-createServer-url].

The example below assumes you have _server.key_ private key file and _server.crt_ publlic certificate file in the root of your project. 

```javascript
// config/production.js
import fs from 'fs';

export default {
    ...
    https: {
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.crt') 
    },
    ...
}    
```

### Using the cluster module

Your application can take advantage of multi-core systems and run more than one process (using node's `cluster` module).
The configuration `cluster` setting allows you to set the number of processes you want to run.

When the `cluster` option is set to `true` then the number of processes will match the number of cores on your server.
You can also directly specify the number of processes you want. 
If that number is less than 1, or if you specify `false`, then you application won't run in a cluster and will just have a single process. 
If that number is greater than the number of cores then the actual number of cores will be used instead.

```javascript
// config/production.js
export default {
    ...
    cluster: true, // Use all cores
    // cluster: 3, // Only use three cores
    ...
}    
```

### Configuration

Configuration is highly flexible and settings can be read from different sources like JSON, environment variables, service class files, etc.

```javascript
// app.js file
'use strict';

import { Server } from 'kikwit';
 
const server = new Server();

server.configure(config => {

    // Merge settings from the specified json file.
    //   You can pass a second argument to indicate whether an exception
    //   should NOT be thrown if the file is missing.    
    config.addJsonFile('config/default.json'); // Fails if the file is missing
    config.addJsonFile(`config/${config.environement}.json`, true); // Doesn't fail if the file is missing
    
    // Merge settings from the specified javascript file.
    //   You can pass a second argument to indicate whether an exception
    //   should NOT be thrown if the file is missing.       
    config.addJavaScriptFile('config/default.js');
    config.addJavaScriptFile(`config/${config.environment}.js`, true);
 
    if (config.isEnvironment('development')) {
    
        // Merge user configuration settings.
        //   More details on services can be found at https://github.com/kikwit/kikwit#user-configuration-tool
        config.addUserConfig();
    }
    
    // Merge environment variables. A string argument (prefix) can be passed to add only the variables
    //  that start with  the specified prefix. The prefix is removed from the variable name when 
    //  the variable is added to the configuration. 
    //  Use double underscores (__) to create a hierarchy.
    //    E.g. 'DB__HOST:ALPHA' gets added as { DB: { HOST: 'ALPHA' } }
    // config.addEnvironmentVariables();
    config.addEnvironmentVariables('APP_'); 

    // Merge the specified object
    config.merge({
        randomFlag: true,
        log: {
            level: 'debug',
            dest: 'file'
        }
    });

    // Read config entries with `config.get(KEY)`
    config.get('log.dest') == 'file';
     
});

server.start().then(() => {
    console.log(`Server started`);
});
```

To avoid storing sensitive data in your code and source control, you can pass them to your program by the use of environment variables or, when in development, by using the User Configuration tool.

#### User Configuration tool

The User configuration tool is used to managed user specific configuration settings.
This tool is included in the official Kikwit __yo__ generator.

You need to run this too in your project root folder.

To read all settings:

```yo kikwit:user-config```

To set a setting:

`yo kikwit:user-config set db.Host GAMMA`

`yo kikwit:user-config set db.Port 8885`

To read a setting:

`yo kikwit:user-config get db`

`yo kikwit:user-config get db.Port`

To remove a setting:

`yo kikwit:user-config remove db.Port`

To clear all settings:

`yo kikwit:user-config clear`

Use the following to add user configuration settings in your application:

```javascript
// app.js file
'use strict';

import { Server } from 'kikwit';
 
const server = new Server();

server.configure(config => {

    // ...
    if (config.isEnvironment('development')) {
    
        // Merge user configuration settings.
        //   More details on services can be found at https://github.com/kikwit/kikwit#user-configuration-tool
        config.addUserConfig();
    }
    // ... 
});

server.start().then(() => {
    console.log(`Server started`);
});
```

### Prerequisites

* Node.js >= 7.0.0

### Tests

`npm test`

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

[querystring-package-url]:https://nodejs.org/api/querystring.html
[querystring-package-parse-url]:https://nodejs.org/api/querystring.html#querystring_querystring_parse_str_sep_eq_options
[https-package-createServer-url]:https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener

[cookies-package-url]: https://www.npmjs.com/package/cookies
[keygrip-package-url]: https://www.npmjs.com/package/keygrip
[ws-package-url]: https://github.com/websockets/ws

[server-sent-events-standard]: https://html.spec.whatwg.org/multipage/comms.html#server-sent-events
