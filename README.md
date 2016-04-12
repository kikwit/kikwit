<a href="#">
    <img src="https://cloud.githubusercontent.com/assets/16418235/13359987/c4e5c7ac-dcae-11e5-9f0c-2cca5ddb11c0.png" alt="Kikwit" width="275" />
</a>

Probably the sexiest web application framework in the Local Group if not the entire Multiverse. 

### Quick Start
We recommend the [Official Yo Generator](https://github.com/kikwit/generator-kikwit) for generating new applications.
```
# Create a folder for your project
mkdir /path/to/my/project
# Change to your project folder
cd /path/to/my/project
# Install yo and kikwit generator
npm install yo generator-kikwit -g
# kickstart your application
yo kikwit
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

### Controllers

By default controller classes are located in the __APP_ROOT/controllers/__ where __APP_ROOT__ folder. The location can be changed using the `controllersRoot` configuration key.
All controller classes must be decorated with `@controller`.

Example:
```
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
```
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

```
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
|@all     |* __(Any method)__|
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
```
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
In the example above, the route url generated for the `list` action is __/prods/catalogue__. 

#### Implicit routing

Implicit routing is when a controller or action is not tagged with a `@route` decorator.

Example:
```
import { controller, get } from 'kikwit';

@controller
export default class Products {

    @get
    list(ctx) {
        ...
    }
}
```
In the example above, the route url generated for the `list` action is __/products/list__. 

#### Route parameters

Routes can define dynamic parts in the following format `:KEY` where _KEY_ is the key used to access the corresponding value from the context.

Example
```
import assert from 'assert';
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

In the example above, if the request was `GET /products/show/laptop` then the `ctx.params.id` would have been equal _laptop_. But if the action route was `@route('/show/:id<\\d+>')` instead then `GET /products/show/laptop` request would have not been routed to the `details` action. 

Route parameters can also be specified on the controller level route decorator.

#### Route names

Action routes can specify a route name which helps generate URLs targeting the route. 

Example:
```
import assert from 'assert';
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
The context's `routeURL(name, params, query, validate = true)` method can be called to generate the URL.

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

Controller actions and all handlers accept a single context argument which provides the following properties and methods:

<dl>
  <dt>ctx.host</dt>
  <dd>
    The request HOST header, or <em>x-forwarded-host</em> request header value when <em>trustProxy</em> setting is set to <em>true</em>, plus the port number, e.g. <em>192.168.1.8:3000</em>.
  </dd>
  <dt>ctx.hostname</dt>
  <dd>
    The request HOST header, or <em>x-forwarded-host</em> request header value when <em>trustProxy</em> setting is set to <em>true</em>, e.g. <em>192.168.1.8</em>.
  </dd>
</dl>

### Handlers

#### Before handlers

#### After handlers


### Prerequisites
* Node.js >= 5.0.0

### Running your application
```
npm start 
# With the above command the application will listen on port 3000 by default. 
# The port can be changed in package.json.
```
### Benchmarks

### Issue Submission

### Feature Requests

### Licence
[GPLv3](http://www.gnu.org/licenses/gpl-3.0.en.html)
