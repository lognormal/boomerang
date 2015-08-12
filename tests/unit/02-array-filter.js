/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.utils filter", function() {
	var assert = chai.assert;

	it("Should return an empty array if the function only returns false", function(){
		var input = [1, 2, 3, 4],
		    expect = [];

		var filterFunction = function() {
			return false;
		};
		assert.deepEqual(BOOMR.utils.arrayFilter(input, filterFunction), expect);
	});

	it("Should return an array of length one if only one returns true", function(){
		var input = [true, false],
		    expect = [true];

		var filterFunction = function(value) {
			return value;
		};

		assert.deepEqual(BOOMR.utils.arrayFilter(input, filterFunction), expect);
		assert.lengthOf(BOOMR.utils.arrayFilter(input, filterFunction), 1);
	});

	it("Should have the array passed in as the third value and return the complete array as passed in", function(){
		var input = [1, 2, 3],
		    expect = input;

		var filterFunction = function(value, index, array) {
			assert.deepEqual(array, expect);
			return true;
		};

		assert.deepEqual(BOOMR.utils.arrayFilter(input, filterFunction), expect);
	});

	it("Should return half the array of numbers as it matches the rule we defined in the filter function", function(){
		var input = [1, 2, 3, 4],
		    expect = [1, 2];

		var filterFunction = function(value) {
			return value <= 2;
		};

		assert.deepEqual(BOOMR.utils.arrayFilter(input, filterFunction), expect);
	});
});
