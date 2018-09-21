/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/24-akamai/04-akamai-mapping-xhr-v6-not-enabled", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should not make an XHR GET request against the v6 domain specified.", function() {
		var expectedV6XhrUrl = "https://trial-eum-clientnsv6-s.akamaihd.net/eum/getdns.txt?c=p" + BOOMR.pageId;

		assert.isDefined(window.testV6Url, "testV6Url should still be defined");
		assert.isDefined(window.testV6ReqMethod, "testV6ReqMethod should still be defined");
		assert.equal(window.testV6ReqMethod, "test04", "Expected the XHR request for V6 to not have been invoked");
		assert.equal(window.testV6Url, "test04", "Expected our test url to set to the test default and not amended.");
	});
});
