/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.plugins.CrossDomain", function() {
	var assert = chai.assert;

	describe("exports", function() {
		it("Should have a CrossDomain object", function() {
			assert.isObject(BOOMR.plugins.CrossDomain);
		});

		it("Should have a is_complete() function", function() {
			assert.isFunction(BOOMR.plugins.CrossDomain.is_complete);
		});
	});
});
