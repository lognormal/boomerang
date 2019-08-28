/*eslint-env mocha*/
/*global chai*/

describe("BOOMR logging", function() {
	var assert = chai.assert;

	it("Should have an existing BOOMR.info() function (Will be set to a stub for less noise during tests)", function() {
		assert.isFunction(BOOMR.info);
		BOOMR.info = function() {};
	});

	it("Should have an existing BOOMR.debug() function (Will be set to a stub for less noise during tests)", function() {
		assert.isFunction(BOOMR.debug);
		BOOMR.debug = function() {};
	});

	it("Should have an existing BOOMR.warn() function (Will be set to a stub for less noise during tests)", function() {
		assert.isFunction(BOOMR.warn);
		BOOMR.warn = function() {};
	});

	it("Should have an existing BOOMR.error() function (Will be set to a stub for less noise during tests)", function() {
		assert.isFunction(BOOMR.error);
		BOOMR.error = function() {};
	});
});
