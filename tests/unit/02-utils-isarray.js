/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.utils.isArray()", function() {
	var assert = chai.assert;

	it("Should return false if input is not an array", function() {
		assert.isFalse(BOOMR.utils.isArray(null));
		assert.isFalse(BOOMR.utils.isArray(undefined));
		assert.isFalse(BOOMR.utils.isArray("a"));
		assert.isFalse(BOOMR.utils.isArray(1));
		assert.isFalse(BOOMR.utils.isArray({}));
		assert.isFalse(BOOMR.utils.isArray(function() {}));
	});

	it("Should return true if input is an array", function() {
		assert.isTrue(BOOMR.utils.isArray([]));
		assert.isTrue(BOOMR.utils.isArray([1, 2, 3, null, undefined]));
	});
});
