/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/24-akamai/05-akamai-mapping-xhr-v4-not-enabled", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should not make an XHR GET request against the v4 domain specified.", function() {
		assert.isDefined(window.testV4Url, "testV4Url should still be defined");
		assert.isDefined(window.testV4ReqMethod, "testV4ReqMethod should still be defined");
		assert.equal(window.testV4ReqMethod, "test05", "Expected the XHR request for V4 to not have been invoked");
		assert.equal(window.testV4Url, "test05", "Expected our test url to set to the test default and not amended.");
	});
});
