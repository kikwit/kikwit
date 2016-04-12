<a href="#">
    <img src="https://cloud.githubusercontent.com/assets/16418235/13359987/c4e5c7ac-dcae-11e5-9f0c-2cca5ddb11c0.png" alt="Kikwit" width="275" />
</a>

Probably the sexiest web application framework in the Local Group if not the entire Multiverse. 

### Quick Start
We recomment the [Official Yo Generator](https://github.com/kikwit/generator-kikwit) for generating new applications.
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
Explicit routing is when a controller and/or action is tagged with the `@route` decorator.

Example:
```
import { controller } from 'kikwit';

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
In the example above, the route url generate for the `list` action is __/prods/catalogue__. 

#### Implicit routing
Implicit routing is when the controller and action are not tagged with the `@route` decorator.

Example:
```
import { controller } from 'kikwit';

@controller
export default class Products {

    @get
    list(ctx) {
        ...
    }
}
```
In the example above, the route url generate for the `list` action is __/products/list__. 


### Prerequisites
* Node.js >= 5.0.0

### Running your application
```
npm start 
# With the above command the application will listen on port 3000 by default. 
# The port can be changed in package.json.
```
### Issue Submission

### Feature Requests

### Licence
[GPLv3](http://www.gnu.org/licenses/gpl-3.0.en.html)
