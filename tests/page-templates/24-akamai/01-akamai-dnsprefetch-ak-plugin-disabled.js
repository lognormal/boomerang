/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/24-akamai/01-akamai-dnsprefetch-ak-plugin-disabled", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should not have Link Rel dns-prefetch element in the Head when config doesn't specify it", function() {
		var boomrIframe = document.getElementsByTagName("iframe");
		assert.isDefined(boomrIframe);
		var preFetchLinkRel = boomrIframe[0].contentDocument.getElementById("dnsprefetchlink");
		// Dont expect Link Rel for DNS prefetch to exist on this page.
		assert.isTrue(preFetchLinkRel === null || preFetchLinkRel === undefined, "preFetchLinkRel should have been null or undefined");
	});
});
