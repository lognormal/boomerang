/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/24-akamai/09-akamai-mapping-multiple-event-triggers-handled-exactly-once", function() {
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

	it("Should only have had one XHR request sent from the page_ready subscription, none for xhr_load", function(){
		assert.equal(window.xhrCounter, 1, "page ready handling seems to have been incorrectly executed twice.");
	});
});
