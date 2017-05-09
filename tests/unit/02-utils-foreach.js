/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.utils.forEach()", function() {
	var assert = chai.assert;

	it("Should handle degenerate cases", function() {
		assert.doesNotThrow(function() {
			BOOMR.utils.forEach();
			BOOMR.utils.forEach(null);
			BOOMR.utils.forEach(true);
			BOOMR.utils.forEach(false);
			BOOMR.utils.forEach(0);
			BOOMR.utils.forEach(1);
			BOOMR.utils.forEach(123);
			BOOMR.utils.forEach("");
			BOOMR.utils.forEach({});
		});
	});

	it("Should not call the callback when the array is empty", function(done) {
		BOOMR.utils.forEach([], function() {
			done(new Error("how dare you"));
		});
		done();
	});

	it("Should have no return value", function() {
		var returnValue = BOOMR.utils.forEach([1, 2, 3], function() {});
		assert.isUndefined(returnValue);
	});

	it("Should iterate over an array", function() {
		var expected = [1, 2, 3];
		var actual = [];
		BOOMR.utils.forEach(expected, function(i) {
			actual.push(i);
		});
		assert.sameMembers(expected, actual);
	});

	it("Should use the correct context on the callback", function(done) {
		function Obj(value) {
			this.value = value;
		}
		Obj.prototype.check = function() {
			assert.strictEqual(this.value, 123);
			done();
		};
		BOOMR.utils.forEach([0], Obj.prototype.check, new Obj(123));
	});

});
