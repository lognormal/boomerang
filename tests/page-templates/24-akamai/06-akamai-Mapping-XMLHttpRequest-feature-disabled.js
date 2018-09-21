/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/24-akamai/06-akamai-mapping-xmlhttprequest-feature-disabled", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should not make an XHR GET request when XMLHttpRequest feature is disabled.", function() {
		assert.isDefined(window.testV4Url, "testV4Url should still be defined");
		assert.isDefined(window.testV4ReqMethod, "testV4ReqMethod should still be defined");
		assert.equal(window.testV4ReqMethod, "test05", "Expected the XHR request for V4 to not have been invoked");
		assert.equal(window.testV4Url, "test05", "Expected our test url set to the test default and not amended.");
	});
});
