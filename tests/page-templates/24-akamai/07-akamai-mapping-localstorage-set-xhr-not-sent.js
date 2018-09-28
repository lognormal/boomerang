/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/24-akamai/07-akamai-mapping-localstorage-set-xhr-not-sent", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should not have made an XHR GET request against the specified v4 domain (if localStorage is supported).", function() {
		if (window.localStorage) {
			assert.isDefined(BOOMR.utils.getLocalStorage("akamaiXhrRetry"));
			assert.isDefined(window.testV4Url, "testV4Url should have been defined after the XHR send");
			assert.isDefined(window.testV4ReqMethod, "testV4ReqMethod should have been defined after the XHR send");
			assert.equal(window.testV4ReqMethod, "test07", "Expected the XHR request for V4 to not have been invoked");
			assert.equal(window.testV4Url, "test07", "Expected our test url to set to the test default and not amended.");
		}
		else {
			return this.skip();
		}
	});
});
