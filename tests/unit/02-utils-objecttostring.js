/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.utils.objectToString()", function() {
	var assert = chai.assert;

	it("Should have an existing function BOOMR.utils.objectToString()", function() {
		assert.isFunction(BOOMR.utils.objectToString);
	});

	it("Should return a string representation of {\"key\": \"value\" } as key=value ", function() {
		var object = {"key": "value"},
		    expected = "key=value";
		assert.equal(BOOMR.utils.objectToString(object), expected);
	});

	it("Should return a string representation of {\"key\": \"value\", \"key2\": \"value2\" } as seperated by the default seperator (\"\\n\\t\") as key=value,key2=value2", function() {
		var object = {"key": "value", "key2": "value2"},
		    expected = "key=value\n\tkey2=value2";

		assert.equal(BOOMR.utils.objectToString(object), expected);
	});

	it("Should return a string representation of {\"key\": \"value\", \"key2\": \"value2\" } as seperated by the custom seperator \"|\" as key=value|key2=value2", function() {
		var object = {"key": "value", "key2": "value2"},
		    expected = "key=value|key2=value2";

		assert.equal(BOOMR.utils.objectToString(object, "|"), expected);
	});

	it("Should return a string representation of a nested object as a flat key value string with default seperator(\",\") as key=value\n\tarray=value2%2Cvalue3 ", function() {
		var object = {"key": "value", "array": ["value2", "value3"]},
		    expected = "key=value\n\tarray=value2,value3";
		assert.equal(BOOMR.utils.objectToString(object), expected);
	});

	it("Should return a string representation of a nested array as a flat key value string with default seperator (\",\") as \"1,2,3%2C4,5,6\" ", function() {
		var object =
		    ["1", "2", ["3,4"], [ ["5", "6"] ] ],
		    expected = "1,2,3,4,5,6";
		assert.equal(BOOMR.utils.objectToString(object, null, 3), expected);
	});

	it("Should escape special characters using encodeURIComponent", function() {
		var object = { "key": "//file" },
		    expected = "key=%2F%2Ffile";
		assert.equal(BOOMR.utils.objectToString(object, "&"), expected);
	});

	it("Should validate the old YUI Boomerang test", function() {
		var o = { one: 1, two: 2, three: "3rd", four: null, five: undefined, six: 0, seven: 1.2, eight: "a=b", nine: [1, 2] };
		var expected = "one=1&two=2&three=3rd&four=null&five=undefined&six=0&seven=1.2&eight=" + encodeURIComponent("a=b") + "&nine=" + encodeURIComponent("1,2");

		assert.strictEqual(expected, BOOMR.utils.objectToString(o, "&"));
		assert.strictEqual(decodeURIComponent(expected.replace(/&/g, "\n\t")), BOOMR.utils.objectToString(o));
	});
});
