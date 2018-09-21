/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/24-akamai/02-akamai-mapping-xhr-v4", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have made an XHR GET request against the v4 domain specified.", function() {
		var expectedV4XhrUrl = "https://trial-eum-clientnsv4-s.akamaihd.net/eum/getdns.txt?c=p" + BOOMR.pageId;

		assert.isDefined(window.testV4Url, "testV4Url should have been defined after the XHR send");
		assert.isDefined(window.testV4ReqMethod, "testV4ReqMethod should have been defined after the XHR send");
		assert.equal(window.testV4ReqMethod, "GET", "Expected the captured XHR request to be a GET type");
		assert.equal(window.testV4Url, expectedV4XhrUrl, "Expected our test url to be captured by the overridden XMLHttpRequest prototype");
	});
});
