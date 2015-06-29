/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.utils.deepmerge()", function() {
	var assert = chai.assert;

	it("Should have a deepmerge function in BOOMR.utils", function() {
		assert.isFunction(BOOMR.utils.deepmerge);
	});

	it("Should return {} with no input", function(){
		assert.deepEqual(BOOMR.utils.deepmerge(), {});
	});

	it("Should return the same object if given the same on  target and source", function(){
		var input = {
			name: "Name",
			age: 12,
			isAvailable: false
		};

		var expect = input;

		assert.deepEqual(BOOMR.utils.deepmerge(input, input), expect);
	});

	it("Should also merge depth object differences", function(){
		var input = {
			name: "Name",
			age: 12,
			isAvailable: false,
			deep: {
				key: false
			}
		}, expect = {
			name: "Name",
			age: 12,
			isAvailable: false,
			deep: {
				key: true
			}
		}, change = {
			deep: {
				key: true
			}
		};

		assert.deepEqual(BOOMR.utils.deepmerge(input, change), expect);
	});
});
