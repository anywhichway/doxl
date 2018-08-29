(function() {
	
	class Variable {
		constructor(name,value) {
			this.name = name;
			this.value = value;
		}
		valueOf() {
			return this.value;
		}
		toJSON() {
			return this.value;
		}
	}
	
	class Skip {
		constructor(count) {
			this.count = count;
		}
	}
	
	class Slice {
		constructor(count) {
			this.count = count;
		}
	}
	
	const doxl = (query,source,{partial,constructorMatch,transform,schema}={},variables={}) => {
		let skip = 0;
		return Object.keys(query).reduce((accum,key,i) => {
			let qvalue = skip ? query[i+skip] : query[key],
				qtype = typeof(qvalue),
				svalue = skip ? source[i+skip] : source[key],
				stype = typeof(svalue);
			if(qvalue===undefined || (svalue===undefined && qtype!=="function")) {
				return accum;
			}
			if(qvalue && qtype==="object" && (qvalue instanceof Skip || qvalue instanceof Slice)) {
				if(isNaN(qvalue.count)) {
					qvalue.count = ((source.length - i) - (query.length - i)) + 1;
				}
				if(qvalue instanceof Slice) {
					accum || (accum = []);
					accum = accum.concat(source.slice(i,i+qvalue.count));
					key = i + qvalue.count;
				}
				skip += qvalue.count;
				qvalue = svalue = source[i + qvalue.count];
				qtype = stype = typeof(svalue);
			}
			if(qvalue===undefined || (svalue===undefined && qtype!=="function")) {
				return accum;
			}
			let value = qvalue,
			vtype = typeof(value);
			if(qtype==="function") {
				value = qvalue.call(source,svalue,key,source,query);
			} else if(stype==="function") {
				value = svalue.call(source,...(Array.isArray(value) ? value : [value]));
				if(value!==undefined) {
					accum || (accum = Array.isArray(query) ? [] : {});
					accum[key] = value;
				} else if(!partial) {
					return null;
				}
				return accum;
			}
			if(value instanceof Variable) {
				if(variables[value.name]===undefined) {
					variables[value.name] = svalue;
				}
				value.value = variables[value.name];
				if(variables[value.name]!==svalue) {
					if(!partial) {
						return null;
					}
					return accum;
				}
				value = svalue;
				vtype = stype;
			}
			if(value && svalue && qtype==="object" && vtype==="object") {
				if(constructorMatch && svalue.constructor!==value.constructor) {
					return;
				}
				if(value instanceof Date) {
					if(stype instanceof Date && svalue.getTime()===value.getTime()) {
						accum || (accum = Array.isArray(query) ? [] : {});
						accum[key] = svalue;
					} else if(!partial) {
						return null;
					}
					return accum;
				}
				if(value instanceof RegExp) {
					if(svalue instanceof RegExp && svalue.flags==value.flags && svalue.source===value.source) {
						accum || (accum = Array.isArray(query) ? [] : {});
						accum[key] = svalue;
					} else if(!partial) {
						return null;
					}
					return accum;
				}
				if(value instanceof Array) {
					if(svalue instanceof Array && svalue.length===value.length) {
						const subdoc = doxl(value,svalue,{partial,constructorMatch,transform,schema},variables);
						if(subdoc!==null) {
							accum || (accum = Array.isArray(query) ? [] : {});
							accum[key] = subdoc;
						} else if(!partial) {
							return null;
						}
					} else if(!partial) {
						return null;
					}
					return accum;
				}
				if(value instanceof Set || value instanceof Map) {
					if(svalue.constructor===value.constructor && svalue.size===value.size) {
						const values = value.values(),
							svalues = svalue.values();
						if(values.every(value => {
							return svalues.some(svalue => {
								return doxl(value,svalue,{partial,constructorMatch,transform,schema},variables);
							})
						})) {
							accum || (accum = Array.isArray(query) ? [] : {});
							accum[key] = svalue;
						} else if(!partial) {
							return null;
						}
					}
					return accum;
				}
				const subdoc = doxl(value,svalue,{partial,constructorMatch,transform,schema},variables);
				if(subdoc!==null) {
					accum || (accum = Array.isArray(query) ? [] : {});
					accum[key] = subdoc;
				} else if(!partial) {
					return null;
				}
				return accum;
			}
			if(qtype==="function") {
				if(qvalue.name==="any" || qvalue.name==="undfnd" || (value!==undefined && value!==false)) { // allow zero
					accum || (accum = Array.isArray(query) ? [] : {});
					accum[key] = (qvalue.name==="any" || qvalue.name==="undfnd" || transform) ? value : svalue;
				} else if(!partial) {
					return null;
				}
				return accum;
			}
			if(value===svalue) {
				accum || (accum = Array.isArray(query) ? [] : {});
				accum[key] = svalue;
			} else if(!partial) {
				return null;
			}
			return accum;
		},null)
	}
	doxl.any = (...args) => function any(sourceValue) { return typeof(sourceValue)==="function" ? sourceValue.call(this,...args) : sourceValue; };
	doxl.undefined = (deflt,...args) => function undfnd(sourceValue) { let value = typeof(sourceValue)==="function" ? sourceValue.call(this,...args) : sourceValue; return value===undefined ? deflt : value; }
	doxl.var = (name) => new Variable(name);
	doxl.skip = (count) => new Skip(count);
	doxl.slice = (count) => new Slice(count);
	doxl.ANY = doxl.any;
	doxl.UNDEFINED = doxl.undefined;
	doxl.reduce = (array,query) => {
		return array.reduce((accum,item) => {
				const match = doxl(query,item);
				if(match) accum.push(match);
				return accum;
			},[]);
	}
	
	if(typeof(module)!=="undefined") module.exports = doxl;
	if(typeof(window)!=="undefined") window.doxl = doxl;
}).call(this);