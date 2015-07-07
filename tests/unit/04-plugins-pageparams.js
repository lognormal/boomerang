/*eslint-env mocha*/
/*global chai*/

describe("BOOMR.plugins.PageParams", function() {
	var assert = chai.assert;
	var plugin = BOOMR.plugins.PageParams;

	describe("exports", function() {
		it("Should have a PageParams object", function() {
			assert.isObject(plugin);
		});

		it("Should have a is_complete() function", function() {
			assert.isFunction(plugin.is_complete);
		});

		it("Should be complete at this point", function() {
			assert.isTrue(plugin.is_complete());
		});
	});

	describe("extractJavaScriptVariableValue", function() {
		var testObj1 = {
			foo: 111
		};

		var testObj2 = {
			foo: [0, 111, 222]
		};

		var testObj3 = {
			foo: [0, [111, [222, [333, [444]]]]]
		};

		var handler = new plugin.Handler({});

		it("Should work with regular property syntax #1", function() {
			assert.equal(111, handler.extractJavaScriptVariableValue(testObj1, "foo"));
		});

		it("Should work with regular property syntax #2", function() {
			assert.sameMembers([0, 111, 222], handler.extractJavaScriptVariableValue(testObj2, "foo"));
		});

		it("Should work with array syntax #1", function() {
			assert.equal(0, handler.extractJavaScriptVariableValue(testObj2, "foo[0]"));
		});

		it("Should work with array syntax #2", function() {
			assert.equal(222, handler.extractJavaScriptVariableValue(testObj2, "foo[2]"));
		});

		it("Should work with double array syntax", function() {
			assert.equal(111, handler.extractJavaScriptVariableValue(testObj3, "foo[1][0]"));
		});

		it("Should work with triple array syntax", function() {
			assert.equal(222, handler.extractJavaScriptVariableValue(testObj3, "foo[1][1][0]"));
		});

		it("Should work with quad array syntax", function() {
			assert.equal(333, handler.extractJavaScriptVariableValue(testObj3, "foo[1][1][1][0]"));
		});

		it("Should return undefined when using an out-of-range index", function() {
			assert.isUndefined(handler.extractJavaScriptVariableValue(testObj2, "foo[10]"));
		});

		it("Should return undefined when using an out-of-range index for the second subscript", function() {
			assert.isUndefined(handler.extractJavaScriptVariableValue(testObj2, "foo[1][10]"));
		});

		it("Should return undefined when using two out-of-range indexes", function() {
			assert.isUndefined(handler.extractJavaScriptVariableValue(testObj2, "foo[10][10]"));
		});

		it("Should return undefined on negative array syntax", function() {
			assert.isUndefined(handler.extractJavaScriptVariableValue(testObj2, "foo[-a]"));
		});

		it("Should return undefined on bad array syntax", function() {
			assert.isUndefined(handler.extractJavaScriptVariableValue(testObj2, "foo[a]"));
		});
	});
});
