/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.utils.inarray()", function() {
	var assert = chai.assert;

	it("Should return false when undefined is passed as the value argument", function() {
		assert.isFalse(BOOMR.utils.inArray());
	});

	it("Should return false when undefined is passed as the array argument", function() {
		assert.isFalse(BOOMR.utils.inArray(1));
	});

	it("Should return false when the array is empty", function() {
		assert.isFalse(BOOMR.utils.inArray(1, []));
	});

	it("Should return false when the element is not in the array", function() {
		assert.isFalse(BOOMR.utils.inArray(1, [2]));
	});

	it("Should return false when the element is not exacty equal (===) to an element in the array", function() {
		assert.isFalse(BOOMR.utils.inArray(1, ["1"]));
	});

	it("Should return true when the element is alone in the array", function() {
		assert.isTrue(BOOMR.utils.inArray("a", ["a"]));
	});

	it("Should return true when the element is in the array twice", function() {
		assert.isTrue(BOOMR.utils.inArray("a", ["a", "aa"]));
	});

	it("Should return true when the element is amongst other elements in the array", function() {
		assert.isTrue(BOOMR.utils.inArray("a", ["b", "a", "c"]));
	});

	it("Should return true when the element is at the end of the array", function() {
		assert.isTrue(BOOMR.utils.inArray("a", ["b", "c", "a"]));
	});

});
