(function() {
	
	
	const oxl = (query,source,{all,constructorMatch,transform,schema}={}) => {
		return Object.keys(query).reduce((accum,key) => {
			const qvalue = query[key],
				qtype = typeof(qvalue),
				svalue = source[key],
				stype = typeof(svalue);
			if(qvalue===undefined || (svalue===undefined && qtype!=="function")) {
				return accum;
			}
			if(stype==="function") {
				const value = svalue.call(source,...(Array.isArray(qvalue) ? qvalue : [qvalue]));
				if(value!==undefined) {
					accum || (accum = Array.isArray(query) ? [] : {});
					accum[key] = value;
				} else if(all) {
					return null;
				}
				return accum;
			}
			if(qvalue && svalue && qtype==="object" && stype==="object") {
				if(constructorMatch && svalue.constructor!==qvalue.constructor) {
					return;
				}
				if(qvalue instanceof Date) {
					if(stype instanceof Date && svalue.getTime()===qvalue.getTime()) {
						accum || (accum = Array.isArray(query) ? [] : {});
						accum[key] = svalue;
					} else if(all) {
						return null;
					}
					return accum;
				}
				if(qvalue instanceof RegExp) {
					if(svalue instanceof RegExp && svalue.flags==qvalue.flags && svalue.source===qvalue.source) {
						accum || (accum = Array.isArray(query) ? [] : {});
						accum[key] = svalue;
					} else if(all) {
						return null;
					}
					return accum;
				}
				if(svalue instanceof Array) {
					if(svalue instanceof Array && svalue.length===qvalue.length) {
						const subdoc = oxl(qvalue,svalue);
						if(subdoc!==null) {
							accum || (accum = Array.isArray(query) ? [] : {});
							accum[key] = subdoc;
						} else if(all) {
							return null;
						}
					} else if(all) {
						return null;
					}
					return accum;
				}
				if(qvalue instanceof Set || qvalue instanceof Map) {
					if(svalue.constructor===qvalue.constructor && svalue.size===qvalue.size) {
						const qvalues = qvalue.values(),
							svalues = svalue.values();
						if(qvalues.every(qvalue => {
							return svalues.some(svalue => {
								return oxl(qvalue,svalue);
							})
						})) {
							accum || (accum = Array.isArray(query) ? [] : {});
							accum[key] = svalue;
						} else if(all) {
							return null;
						}
					}
					return accum;
				}
				const subdoc = oxl(qvalue,svalue);
				if(subdoc!==null) {
					accum || (accum = Array.isArray(query) ? [] : {});
					accum[key] = subdoc;
				} else if(all) {
					return null;
				}
				return accum;
			}
			if(qtype==="function") {
				let value;
				if((value=qvalue(svalue,key,source,query)) &&  value!==undefined && value!==false) { // allow zero
					accum || (accum = Array.isArray(query) ? [] : {});
					accum[key] = (qvalue.name==="OXLUNDEFINED" || transform) && value!==qvalue ? value : svalue;
				} else if(all) {
					return null;
				}
				return accum;
			}
			if(qvalue===svalue) {
				accum || (accum = Array.isArray(query) ? [] : {});
				accum[key] = svalue;
			} else if(all) {
				return null;
			}
			return accum;
		},null)
	}
	oxl.ANY = () => true;
	oxl.UNDEFINEDOK = deflt => function OXLUNDEFINED(value) { return value===undefined ? deflt||OXLUNDEFINED : value; }
	
	if(typeof(module)!=="undefined") module.exports = oxl;
	if(typeof(window)!=="undefined") window.oxl = oxl;
}).call(this);