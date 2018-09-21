/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/24-akamai/03-akamai-mapping-xhr-v6", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have made an XHR GET request against the v6 domain specified.", function() {
		var expectedV6XhrUrl = "https://trial-eum-clientnsv6-s.akamaihd.net/eum/getdns.txt?c=p" + BOOMR.pageId;

		assert.isDefined(window.testV6Url, "testV6Url should have been defined after the XHR send");
		assert.isDefined(window.testV6ReqMethod, "testV6ReqMethod should have been defined after the XHR send");
		assert.equal(window.testV6ReqMethod, "GET", "Expected the captured XHR request to be a GET type");
		assert.equal(window.testV6Url, expectedV6XhrUrl, "Expected our test url to be captured by the overridden XMLHttpRequest prototype");
	});
});
