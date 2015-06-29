/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.utils.deepmerge()", function() {
	var assert = chai.assert;

	it("Should have filterByWhitelist", function(){
		assert.isFunction(BOOMR.utils.filterByWhitelist);
	});

	it("Should return {} if n1o input", function(){
		assert.deepEqual(BOOMR.utils.filterByWhitelist(), {});
	});

	it("Should return empty {} as whitelist is empty so none of the passed elements should go through", function() {
		var whitelist = [],
		    input = {
			    key: "value"
		    },
		    expect = {};

		assert.deepEqual(BOOMR.utils.filterByWhitelist(input, whitelist, "."), expect);
	});
});
