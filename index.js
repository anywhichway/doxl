(function() {
	
	
	const doxl = (query,source,{partial,constructorMatch,transform,schema}={}) => {
		return Object.keys(query).reduce((accum,key) => {
			const qvalue = query[key],
				qtype = typeof(qvalue),
				svalue = source[key],
				stype = typeof(svalue);
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
				if(svalue instanceof Array) {
					if(svalue instanceof Array && svalue.length===value.length) {
						const subdoc = doxl(value,svalue);
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
				if(qvalue instanceof Set || value instanceof Map) {
					if(svalue.constructor===value.constructor && svalue.size===value.size) {
						const values = value.values(),
							svalues = svalue.values();
						if(values.every(value => {
							return svalues.some(svalue => {
								return doxl(value,svalue);
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
				const subdoc = doxl(value,svalue);
				if(subdoc!==null) {
					accum || (accum = Array.isArray(query) ? [] : {});
					accum[key] = subdoc;
				} else if(!partial) {
					return null;
				}
				return accum;
			}
			if(qtype==="function") {
				if(qvalue.name==="ANY" || qvalue.name==="UNDEFINED" || (value!==undefined && value!==false)) { // allow zero
					accum || (accum = Array.isArray(query) ? [] : {});
					accum[key] = (qvalue.name==="ANY" || qvalue.name==="UNDEFINED" || transform) ? value : svalue;
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
	doxl.ANY = (...args) => function ANY(sourceValue) { return typeof(sourceValue)==="function" ? sourceValue.call(this,...args) : sourceValue; };
	doxl.UNDEFINED = (deflt,...args) => function UNDEFINED(sourceValue) { let value = typeof(sourceValue)==="function" ? sourceValue.call(this,...args) : sourceValue; return value===undefined ? deflt : value; }
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