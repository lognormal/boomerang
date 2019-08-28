/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.utils exports", function() {
	var assert = chai.assert;

	it("Should have an existing BOOMR.utils object", function() {
		assert.isObject(BOOMR.utils);
	});

	it("Should have an existing Function BOOMR.utils.cleanUpURL()", function() {
		assert.isFunction(BOOMR.utils.cleanupURL);
	});

	it("Should have an existing Function BOOMR.utils.hashQueryString()", function() {
		assert.isFunction(BOOMR.utils.hashQueryString);
	});

	it("Should have an existing Function BOOMR.utils.pluginConfig()", function() {
		assert.isFunction(BOOMR.utils.pluginConfig);
	});
});
