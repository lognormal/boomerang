/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/106359", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have '#foo'", function() {
		assert.isDefined(document.getElementById("foo"), "#foo exists");
	});

	it("Should have '#foo' have the root page's prototype", function() {
		assert.equal(document.getElementById("foo").foo, 1, "#foo has a '.foo' property");
	});
});
