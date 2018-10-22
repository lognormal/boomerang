/*eslint-env mocha*/
/*global chai*/

describe("BOOMR exports", function() {
	var assert = chai.assert;

	it("Should have an existing BOOMR object", function() {
		assert.isObject(BOOMR);
	});

	it("Should have an existing BOOMR.utils object", function() {
		assert.isObject(BOOMR.utils);
	});

	it("Should have an existing BOOMR.version String", function() {
		assert.isString(BOOMR.version);
	});

	it("Should have an existing BOOMR.session Object", function() {
		assert.isObject(BOOMR.session);
	});

	it("Should have an existing BOOMR.init() Function", function() {
		assert.isFunction(BOOMR.init);
	});

	it("Should have an existing BOOMR.plugins Object", function(){
		assert.isObject(BOOMR.plugins);
	});

	it("Should have an existing BOOMR.url value", function(){
		assert.isString(BOOMR.url);
	});
});
