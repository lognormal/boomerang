/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/24-akamai/00-akamai-dnsprefetch-enabled", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have rel dns-prefetch link element in the Head", function() {
		var expectedHref = "http://vqjxdonmdayiixaaqgkq-p-aac8b7aec-clientnsv4-s.akamaihd.net/";
		var boomrIframe = document.getElementsByTagName("iframe");
		assert.isDefined(boomrIframe);
		var preFetchLinkRel = boomrIframe[0].contentDocument.getElementById("dnsprefetchlink");
		assert.isDefined(preFetchLinkRel);
		assert.isNotNull(preFetchLinkRel);
		assert.equal(preFetchLinkRel.href, expectedHref, "Incorrect href, expected: " + expectedHref + "; but got: " + preFetchLinkRel.href);
	});
});
