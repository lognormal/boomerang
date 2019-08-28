/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.utils.isNative()", function() {
	var assert = chai.assert;

	it("Should return false if input is not an function", function() {
		assert.isFalse(BOOMR.utils.isNative(null));
		assert.isFalse(BOOMR.utils.isNative(undefined));
		assert.isFalse(BOOMR.utils.isNative());
		assert.isFalse(BOOMR.utils.isNative(""));
		assert.isFalse(BOOMR.utils.isNative(1));
		assert.isFalse(BOOMR.utils.isNative(true));
		assert.isFalse(BOOMR.utils.isNative(false));
		assert.isFalse(BOOMR.utils.isNative(NaN));
	});

	it("Should return true if input is a native function", function() {
		assert.isTrue(BOOMR.utils.isNative(Object));
		assert.isTrue(BOOMR.utils.isNative(Number));
		assert.isTrue(BOOMR.utils.isNative(parseInt));
	});

	it("Should return false if input is not a native function", function() {
		var nonNative = function(bar) {
			return false;
		};

		assert.isFalse(BOOMR.utils.isNative(nonNative));
	});

	it("Should return false for a polyfill", function() {
		var _parseInt = window.parseInt;
		window.parseInt = function(bar) {
			return false;
		};

		assert.isFalse(BOOMR.utils.isNative(window.parseInt));

		window.parseInt = _parseInt;
	});
});
