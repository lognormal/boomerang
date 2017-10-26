/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.utils.arrayFind()", function() {
	var assert = chai.assert;

	it("Should return undefined if input is not an array", function() {
		var findFunction = function() {
			return false;
		};
		assert.isUndefined(BOOMR.utils.arrayFind(null, findFunction));
	});

	it("Should return undefined if predicate is not a function", function() {
		var input = [1, 2, 3, 4];

		assert.isUndefined(BOOMR.utils.arrayFind(input, null));
	});

	it("Should return undefined if the predicate only returns false", function() {
		var input = [1, 2, 3, 4];

		var findFunction = function() {
			return false;
		};
		assert.isUndefined(BOOMR.utils.arrayFind(input, findFunction));
	});

	it("Should return value of match if only one matches", function() {
		var input = [1, 2, 3, 4],
		    expect = 3;

		var findFunction = function(value) {
			return value === 3;
		};

		assert.equal(BOOMR.utils.arrayFind(input, findFunction), expect);
	});

	it("Should return value of first match if multiple matches", function() {
		var input = [1, 2, 3, 4],
		    expect = 2;

		var findFunction = function(value, index, array) {
			return value >= 2;
		};

		assert.equal(BOOMR.utils.arrayFind(input, findFunction), expect);
	});

	it("Should return undefined if no matches", function() {
		var input = [1, 2, 3, 4];

		var findFunction = function(value) {
			return value === 0;
		};

		assert.isUndefined(BOOMR.utils.arrayFind(input, findFunction));
	});

	it("Should also work if find has been set to null or undefined (ie. lacking [].find support)", function() {
		var input = [1, 2, 3, 4],
		    expect = 2;

		input.filter = undefined;

		var findFunction = function(value) {
			return value >= 2;
		};

		assert.equal(BOOMR.utils.arrayFind(input, findFunction), expect);
	});
});
