# doxl v0.1.5

Like GraphQL except for Javascript objects, pattern matching extraction and transformation of sub-objects from Javascript objects.

Just 896 bytes compressed and gzipped.

# Installation

npm install doxl

The browser version does not require transpiling but exists at `browser/doxl.js`.

# Usage

Either include `doxl.js` through an import statement, script tag or require statement. Then it is pretty darn simple ...

Just call `doxl(query,source)` where query and source are both JavaScript objects. The value returned will be the
subset of source, if any, such that its properties satisfy at least one of the following:

  1) the value was an exact match for the same property on the query
  
  2) the value satisfied a function test provided in the query, i.e. the function returns truthy or null or zero, not undefined or false.
  
  3) the value results from calling a function on the source with the query property value as arguments
  

```javascript
const match = doxl({name:doxl.any(),age:value => value >= 21},{name:"joe",age:21,gender:"male",address:{city:"seattle"}});
```

will return

```javascript
{name:"joe",age:21,address:{city:"seattle"}}}
```

# API

`doxl(query,source,{partial,constructorMatch,transform,schema}={})` - 

  `query` - An object, possibly nested, that contains properties to extract and values to literally match or functions to test for a match.
  
  `source` - An object from which to extract data. Any functions on the source object will be called with the arguments
  `(...queryValue)`, with `this` bound to `source`. For fat arrow functions, `source` is not available as `this`. Mapping single arguments into
  the array required for `...queryValue` is done automatically. If your function takes a single argument that is an array, then you must nest
  it one level, e.g. `f(someArray)` should use the query `{f:[matchingArray]}` not `{f:matchingArray}`.
  
  `partial` - The default behavior is to return only full matches. If `partial` is truthy, then a value will returned if any properties match.
  
  `constructorMatch` - Typically the `query` and `source` will be POJOs and with the exception of `Array`, `Date`, `RegExp`, `Map`, 
  and `Set` the class of a source or its nested objects is ignored. If `constructorMatch` is truthy, then the constructors for the `query`
  and `source` must match.
  
  `transform` - Typically any functions in the `query` are treated as predicates that return a truthy or falsy value; however, if `transform` is
  truthy then these functions will consume the value from the `source` and return the same or a different value for use in the result. If the value returned is `undefined`,
  then it is assumed no match occured.
  
  `schema` - Reserved for future use.
  
 `doxl.any(...args)` - A utility function to match any value. If the optional `...args` are passed in and the value on the underlying object being queried is a function,
 then it will be called with the args and the `this` scope set to the object being queried. 
 
 `doxl.skip(count)` - A utility function to skip indexes in a source array, e.g. `[1,doxl.skip(2),1]` will match both `[1,2,3,1]` and `[1,3,3,1]`.
 
 `doxl.var(name)` - A utility function to support variable binding and matching across a pattern, e.g. `[doxl.var("val"),2,doxl.var("val")]` will match arrays with the same first and last values. Variables bind from left to right and nested variables are available to higher level classes to their right, e.g, `{nested:{num:doxl.var("n")},num:doxl.var("n")}` will match `{num:1,nested:{num: 1}}`.
 
 `doxl.undefined(default,...args)` - A utility function that will match undefined properties in the `source`. If `default` is provided, it will be
 returned as the value for the undefined property.

# Application Techniques


## Query Functions

Functions defined on the query should one of these two signatures:

`function(sourceValue,property,source,query) { ...; }`

`(sourceValue,property,source,query) => { ...; }`

When doing regular queries, they should return `true` if the `property` and `sourceValue` should be included in the result. Normally, similar to the use of `forEach`
in JavaScript, all but the first value is ignored, the additional arguments are for advanced use, e.g.

```
{age: value => value >= 21}
```

Behind the scenes, the functions `doxl.any` and `doxl.undefined` are implemented in a manner that usese these extended arguments.

If `doxl` is invoked with a query and the option `tranform:true`, then the return value of the function is used as the property value rather than the value on the source object, unless it is `undefined`.

## Handling `undefined`

A `source` can have an undefined property and still have a successful match by using `doxl.undefined`.


```javascript
doxl({name:olx.any,age:doxl.any(),gender:doxl.undefined()},{age:21,name:"joe"});
```

will match:

```javascript
{name:"joe",age:21}
```

While,

```javascript
doxl({name:olx.any,age:doxl.any(),gender:doxl.undefined()},{age:21,name:"joe",gender:"male"});
```

will return:

```javascript
{name:"joe",age:21,gender"male"}
```

`doxl.undefined` can also take as a second argument a default value.

For instance,

```javascript
doxl({name:olx.any,age:doxl.any(),gender:doxl.undefined("undeclared")},{age:21,name:"joe"});
```

will return:

```javascript
{name:"joe",age:21,gender:"undeclared"}
```

Finally, `doxl.undefined` cam take additional arguments which are passed to underlying target functions that match query property names.

## Processing Arrays Of Possible Matches

Assume you have an array of objects you wish to search, you can reduce it using `reduce` and `doxl`:

```javascript
[{name:"joe",age:21,employed:true},
 {name:"mary",age:20,employed:true},
 {name:"jack",age:22,employed:false}
].reduce(item => {
	const match = doxl({name:doxl.any(),age:value => value > 21,employed:false},item));
	if(match) accum.push(match);
	return accum;
},[]);
```

will return:

```javascript
[{name:"jack",age:22,employed:false}]
```

There is a utility function, `doxl.reduce(array,query)` that does this for you, e.g.

```
doxl.reduce([{name:"joe",age:21,employed:true},
 {name:"mary",age:20,employed:true},
 {name:"jack",age:22,employed:false}
],{name:doxl.any(),age:value => value >= 21,employed:false})
```


## Re-Ordering Keys

```javascript
doxl({name:olx.any(),age:doxl.any()},{age:21,name:"joe"});
```

will return:

```javascript
{name:"joe",age:21}
```

## Dynamic Property Values

If your source objects are class instances with methods or objects containing functions, they will get resolved using the value as the arguments:

```javascript
class Person {
	constructor({firstName,lastName,favoriteNumbers=[]}) {
		this.firstName = firstName;
		this.lastName = lastName;
		this.favoriteNumbers = favoriteNumbers;
	}
	name(salutation="") {
		return `${salutation ? salutation+ " " : ""}${this.lastName}, ${this.firstName}`;
	}
	someFavoriteNumber(number) {
		if(this.favoriteNumbers.includes(number)) {
			return number;
		}
	}
}

const people = [
	new Person({firstName:"joe",lastName:"jones",favoriteNumbers:[5,15]}),
	new Person({firstName:"mary",lastName:"contrary",favoriteNumbers:[7,14]})
	];

const matches = people.reduce((accum,item) => { 
		const match = doxl({name:doxl.any(),someFavoriteNumber:7},item,{all:true});
		if(match) accum.push(match);
		return accum;
	},[]);
```

will return:

```javascript
[{name:"contrary, mary",someFavoriteNumber:7}]
```

If the underlying object property is a function that takes multiple arguments, use `doxl.args(...args)` in place of a single value.

`doxl.any` and `doxl.undefined` can also take arguments to pass to underlying functions, e.g.

```javascript
{name:doxl.any("M.")}
```

```javascript
{name:doxl.undefined("Secret","M.")}
```

## Transformations

If the option `transform` is truthy, object transformations can occur:

```javascript
doxl({size: value => size * 2},{size: 2},{transform:true});
```

results in:

```javascript
{size: 4}
```

## Shorter Code

If you assign `doxl` to the variable `$` or `_`, you can shorten your code, e.g. 

```javascript
{name:$.undefined("Secret","M.")}
```

# Why doxl

There are other extraction and transformation libraries, but most require using strings that need to be parsed, increasing the library size and the chance for typographical errors. In the extreme case, they introduce domain specific languages that force the developer to learn an entirely new syntax and semantics. The DOXL library allows the expression of extraction directives as pure JavaScript and is very small. Furthermore, few libraries support variable binding within extraction patterns.

# Release History (reverse chronological order)

2018-08-28 v0.1.5 Documentation updates. Deprecating `doxl.UNDEFINED` and `doxl.ANY` in favor of `doxl.undefined` and `doxl.any`. Will be unsupported as of v0.1.8. Added support for `doxl.var`.

2018-08-24 v0.1.4 Documentation updates.

2018-08-24 v0.1.3 Documentation updates.

2018-08-23 v0.1.2 Documentation updates. Changes to behavior of `doxl.ANY`, which is now a function and can pass arguments to underlying query targets. 
Enhancements to `doxl.UNDEFINED` to do the same. Also, renamed `doxl.UNDEFINEDOK` to simply `doxl.UNDEFINED`.

2018-08-02 v0.1.1 Documentation updates.

2018-08-02 v0.1.0 First public release as independent module.

# License

MIT License

Copyright (c) 2018 Simon Y. Blackwell, AnyWhichWay, LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
