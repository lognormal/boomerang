/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/00-custom-metrics", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have h.cr as the last parameter of the GET beacon URL (if ResourceTiming is enabled)", function() {
		if (t.isResourceTimingSupported()) {
			var b = t.findResourceTimingBeacon();

			var searchString = "h.cr=abc";

			// .endsWith()
			var position = b.name.length;
			position -= searchString.length;
			var lastIndex = b.name.indexOf(searchString, position);
			assert.isTrue(lastIndex !== -1 && lastIndex === position);
		}
	});
});
