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

By default controller classes are located in the __APP_ROOT/controllers/__ where __APP_ROOT__ folder. The location can be changed using the 

`controllersRoot` configuration key.
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

In the example above, if the request was `GET /products/show/laptop` then the `ctx.params.id` would have been equal _laptop_. But if the action route was 

`@route('/show/:id<\\d+>')` instead then `GET /products/show/laptop` request would have not been routed to the `details` action. 

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
  <dt>host</dt>
  <dd>
    The request HOST header, or <em>X-FORWARDED-HOST</em> request header value (if present) when <em>trustProxy</em> setting is set to <em>true</em>, plus 

the port number.
  </dd>
  <dt>hostname</dt>
  <dd>
    The request HOST header, or <em>X-FORWARDED-HOST</em> request header value (if present) when <em>trustProxy</em> setting is set to <em>true</em>.
  </dd>
  <dt>ip</dt>
  <dd>
    The request client ip address, or the first entry from <em>X-FORWARDED-FOR</em> request header value (if present) when <em>trustProxy</em> setting is 

set to <em>true</em>.
  </dd>
  <dt>ips</dt>
  <dd>
    An array containing the request client ip address, or the all entries from <em>X-FORWARDED-FOR</em> request header value (if present) when 

<em>trustProxy</em> setting is set to <em>true</em>.
  </dd> 
  <dt>logger</dt>
  <dd>
    The logger specified in the configuration file. If no logger is prvided then, when the environment is <em>development</em>, <em>ctx.logger</em> will 

point to the <em>console</em>.
  </dd> 
  <dt>port</dt>
  <dd>
    The request port number, or <em>X-FORWARDED-PORT</em> request header value (if present) when <em>trustProxy</em> setting is set to <em>true</em>.
  </dd>
  <dt>protocol</dt>
  <dd>
    The request protocol (http or https), or <em>X-FORWARDED-PROTO</em> request header value (if present) when <em>trustProxy</em> setting is set to 

<em>true</em>.
  </dd>  
  <dt>subdomains</dt>
  <dd>
    An array containing the request subdomains. By default the domain is the last two parts of the host. The <em>subdomainOffset</em> configuration setting 

can be used to specify the number of parts that constitutes the application domain. The remaining parts are the subdomains.
    <br />
    e.g. for <em>user.api.kikwitjs.com</em> the subdomain would be ['api', 'user'] if <em>subdomainOffset</em> configuration setting is 2 (default) and 

['user'] if it's set to 3.
  </dd>
  <dt>download(path [, filename], [contentType] [, options])</dt>
  <dd>
    Sends the contents of the file at path to for download. 
The base name of the path argument is used as default value for the <em>Content-Disposition</em> header <em>filename</em> value unless <em>filename</em> 

argument is specified.<em>Content-Disposition</em> header is set to <em>attachment</em> unless already set by the calling code.
The response content type is derived from the file extension but an explicit value can be specified using the <em>contentType</em> argument.
The optional <em>options</em> argument can specify the following:
<ul>
    <li><strong><em>lastModified</em></strong>: if <em>true</em>, set the <em>Last-Modified</em> header to the file's last modified time.</li>
    <li>
        <strong><em>root</em></strong>: the root folder containing <em>path</em>. 
        <br />
        If <em>root</em> is provided then <em>path</em> is always treated as relative.
        <br />
        If <em>root</em> is not provided and <em>path</em> is not absolute then <em>root</em> defaults to the application root folder.
    </li>
    <li>
        <strong><em>headers</em></strong>: additional headers to add to the response.
        <br />
        If <em>headers</em> is an object then its keys are used as header names and the corresponding values as header values.
        <br />
        If <em>headers</em> is a function then it's called with a single argument representing the full path of the file and any returned object is used to 

generate additional headers.
    </li>
</ul>
  </dd> 
  <dt>next()</dt>
  <dd>
    Calls the next handlers if any. When called in the last <em>@before</em> handler, this method will call the target action. If called in the last <em>@after</em> handler, the call does 

nothing.
    <br />
    The <em>next()</em> valid to call in handlers only.
  </dd> 
  <dt>redirect(url [, statusCode])</dt>
  <dd>
    Redirects the request by setting a <em>LOCATION</em> header.
    <br />
    The <em>statusCode</em> argument defaults to 302.
  </dd>
  <dt>send(body [, contentType])</dt>
  <dd>
    Sends the response using <em>body</em>, converted to string, as content. 
    <br />
    The <em>contentType</em> argument, if not provided, defaults to <em>text/plain; charset=utf-8</em>.
  </dd>
  <dt>sendJSON(body)</dt>
  <dd>
    Sends the response using <em>body</em> as content.
    <br />
    The <em>CONTENT-TYPE</em> header, if not set by the calling code, is set to <em>application/json</em>.
  </dd>
  <dt>sendJSON(body)</dt>
  <dd>
    Sends the response using <em>body</em> as content.
    <br />
    The <em>CONTENT-TYPE</em> header, if not set by the calling code, is set to <em>application/json</em>.
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

### Maintainers

* Elondo Mbonze <mbonze.elondo@gmail.com> (Creator)

### Licence
[GPLv3](http://www.gnu.org/licenses/gpl-3.0.en.html)
