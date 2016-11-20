/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/00-basic/02-events", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should have fired myevent with the correct data", function() {
		assert.equal("a", window.myevent);
	});
});
