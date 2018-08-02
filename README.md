# doxl v0.1.0

Like GraphQL except for Javascript objects, extracts and optionally transforms sub-objects from Javascript objects.

# Installation

npm install doxl

The browser version does not require transpiling but exists at `browser/doxl.js`.

# Usage

Either include `doxl.js` through an import stamement, script tag or require statement. Then it is pretty darn simple ...

Just call `doxl(query,source)` where query and source are both JavaScript objects. The value returned will be the
subset of source, if any, that has the found properties from the query such that they have at least one of the following:

  1) an exact match for value
  
  2) satisfied a function test provided in the query, i.e. function returns truthy or null or zero, not undefined or false.
  
  3) have a value that results from calling a function on the source with the query property value as arguments
  

```
const match = doxl({name:doxl.ANY,age:value => value >= 21},
					 {name:"joe",age:21,gender:"male",address:{city:"seattle"}});
```

will return

```
{name:"joe",age:21,address:{city:"seattle"}}}
```

# API

`doxl(query,source,{partial,constructorMatch,transform,schema}={})` - 

  `query` - An object, possibly nested, that contains properties to extract and values to literally match or functions to test for a match.
  
  `source` - An object from which to extract data. Any functions on the source object will be called with the arguments
  `(...queryValue)`, with `this` bound to `source`. For fat arrow functions, `source` is not available. Mapping single arguments into
  the array required for `...queryValue` is done automatically. If your function takes a single argument that is an array, then you must nest
  it one level, e.g. `f(someArray)` should be use the query `{f:[matchingArray]}` not `{f:matchingArray}`.
  
  `partial` - The default behavior is to return only full matches. If `partial` is truthy, then a value will returned for any properties match.
  
  `constructorMatch` - Typically the `query` and `source` will be POJOs and with the exception of `Array`, `Date`, `RegExp`, `Map`, 
  and `Set` the class of a source or its nested objects is ignored. If `constructorMatch` is truthy, then the constructors for the `query`
  and `source` must match.
  
  `transform` - Typically any functions in the `query` are treates as predicated that return a truthy or falsy value; however, if `transform` is
  truthy then these functions can consume the value from the `source` and return the same or a different value. If the value returned is `undefined`,
  then it is assumed no match occured.
  
  `schema` - Reserved for future use.
  
 `doxl.ANY` - A utility function defined as `() => true` that will match any value.
 
 `doxl.UNDEFINEDOK(default)` - A utility function that will match undefined properties in the `source`. If `default` is provided, it will be
 returned as the value for the undefined property.

# Application Techniques

## Handling `undefined`

A `source` can have an undefined property and still have a successful match by using `doxl.UNDEFINEDOK`.


```
doxl({name:olx.ANY,age:doxl.ANY,gender:doxl.UNDEFINEDOK()},{age:21,name:"joe"});
```

will match:

```
{name:"joe",age:21}
```

And,

```
doxl({name:olx.ANY,age:doxl.ANY,gender:doxl.UNDEFINEDOK()},{age:21,name:"joe",gender:"male"});
```

will match:

```
{name:"joe",age:21,gender:"male"}
```

Whereas,

```
doxl({name:olx.ANY,age:doxl.ANY,gender:doxl.UNDEFINEDOK("undeclared")},{age:21,name:"joe"});
```

will match:

```
{name:"joe",age:21,gender:"undeclared"}
```


## Processing Arrays Of Possible Matches

Assume you have an array of objects you wish to search, you can reduce it using `reduce` and `doxl`:

```
[{name:"joe",age:21,employed:true},
 {name:"mary",age:20,employed:true},
 {name:"jack",age:22,employed:false}
].reduce(item => {
	const match = doxl({name:doxl.ANY,age:value => value >= 21,employed:false},item,{all:true}));
	if(match) accum.push(match);
	return accum;
},[]);
```

will match:

```
{name:"jack",age:22,employed:false}
```

## Re-Ordering Keys

```
doxl({name:olx.ANY,age:doxl.ANY},{age:21,name:"joe"});
```

will return:

```
{name:"joe",age:21}
```

## Dynamic Property Values

If your source objects are class instances with methods or objects containing functions, they will get resolved:

```
class Person {
			constructor({firstName,lastName,favoriteNumbers=[]}) {
				this.firstName = firstName;
				this.lastName = lastName;
				this.favoriteNumbers = favoriteNumbers;
			}
			name() {
				return `${this.lastName}, ${this.firstName}`;
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
				const match = doxl({name:doxl.ANY,someFavoriteNumber:7},item,{all:true});
				if(match) accum.push(match);
				return accum;
			},[]);
```

will match:

```
{name:"contrary, mary",someFavoriteNumber:7}
```

## Transformations

If the option `transform` is truthy, object transformations can occur:

```
doxl({size: value => size * 2},{size: 2},{transform:true});
```

results in:

```
{size: 4}
```

# Why doxl

Most other extraction and transformation libraries require specifying critical specification as strings that need to be parsed
increasing the library size and the chance for typographical errors. In the extreme case they for the developer to learn an entirely
new syntax and semantics. The `doxl` library is small and pure Javascript.


# Release History (reverse chronological order)

2018-08-02 First public release as independent module.

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
