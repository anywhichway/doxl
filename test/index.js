var chai,
	expect,
	oxl;

if(typeof(module)!=="undefined") {
	oxl = require("../index.js");
}

console.log("Testing ...");

const SOURCE = {bool:true,num:1,nil:null,str:"str",nested:{num:1},array:[1,"1"]};

describe("all tests",function() {
	it("literal boolean match",function(done) {
		const query = {bool:true},
			match = oxl(query,SOURCE);
		expect(JSON.stringify(match)).equal(JSON.stringify(query));
		done();
	});
	it("literal null match",function(done) {
		const query = {nil:null},
			match = oxl(query,SOURCE);
		expect(JSON.stringify(match)).equal(JSON.stringify(query));
		done();
	});
	it("literal number match",function(done) {
		const query = {num:1},
			match = oxl(query,SOURCE);
		expect(JSON.stringify(match)).equal(JSON.stringify(query));
		done();
	});
	it("literal string match",function(done) {
		const query = {str:"str"},
			match = oxl(query,SOURCE);
		expect(JSON.stringify(match)).equal(JSON.stringify(query));
		done();
	});
	it("nested match",function(done) {
		const query = {nested:{num:1}},
			match = oxl(query,SOURCE);
		expect(JSON.stringify(match)).equal(JSON.stringify(query));
		done();
	});
	it("array match",function(done) {
		const query = {array:[1,"1"]},
			match = oxl(query,SOURCE);
		expect(JSON.stringify(match)).equal(JSON.stringify(query));
		done();
	});
	it("functional match",function(done) {
		const query = {num:value => value===1},
			match = oxl(query,SOURCE);
		expect(JSON.stringify(match)).equal(JSON.stringify({num:1}));
		done();
	});
	it("functional mis-match",function(done) {
		const query = {num:value => value!==1},
			match = oxl(query,SOURCE);
		expect(match).equal(null);
		done();
	});
	it("functional match",function(done) {
		const query = {num:value => value===1},
			match = oxl(query,SOURCE);
		expect(JSON.stringify(match)).equal(JSON.stringify({num:1}));
		done();
	});
	it("all multi-match",function(done) {
		const query = Object.keys(SOURCE).reduce((accum,key) => { accum[key] = oxl.ANY; return accum; },{});
			match = oxl(query,SOURCE);
		expect(JSON.stringify(match)).equal(JSON.stringify(SOURCE));
		done();
	});
	it("undefined",function(done) {
		const match = oxl({name:oxl.ANY,age:oxl.ANY,gender:oxl.UNDEFINEDOK()},{age:21,name:"joe"},{all:true});
		expect(JSON.stringify(match)).equal(JSON.stringify({name:"joe",age:21}));
		done();
	});
	it("not undefined",function(done) {
		const match = oxl({name:oxl.ANY,age:oxl.ANY,gender:oxl.UNDEFINEDOK()},{age:21,name:"joe",gender:"male"},{all:true});
		expect(JSON.stringify(match)).equal(JSON.stringify({name:"joe",age:21,gender:"male"}));
		done();
	});
	it("undefined default",function(done) {
		const match = oxl({name:oxl.ANY,age:oxl.ANY,gender:oxl.UNDEFINEDOK("undeclared")},{age:21,name:"joe"},{all:true});
		expect(JSON.stringify(match)).equal(JSON.stringify({name:"joe",age:21,gender:"undeclared"}));
		done();
	});
	it("reduce",function(done) {
		const matches = [{name:"joe",age:21,employed:true},{name:"mary",age:20,employed:true},{name:"jack",age:22,employed:false}].reduce((accum,item) => {
				const match = oxl({name:oxl.ANY,age:value => value >= 21,employed:false},item,{all:true});
				if(match) accum.push(match);
				return accum;
			},[]);
		console.log(matches)
		expect(matches.length).equal(1);
		expect(JSON.stringify(matches[0])).equal(JSON.stringify({name:"jack",age:22,employed:false}));
		done();
	});
	it("dynamic properties",function(done) {
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
				const match = oxl({name:oxl.ANY,someFavoriteNumber:7},item,{all:true});
				if(match) accum.push(match);
				return accum;
			},[]);
		expect(matches.length).equal(1);
		expect(JSON.stringify(matches[0])).equal(JSON.stringify({name:"contrary, mary",someFavoriteNumber:7}))
		done();
	});
	it("transform",function(done) {
		const match = oxl({size: value => value * 2},{size: 2},{transform:true});
		expect(JSON.stringify(match)).equal(JSON.stringify({size:4}));
		done();
	});
});


if(typeof(window)!=="undefined") {
	mocha.run();
}
		
		



