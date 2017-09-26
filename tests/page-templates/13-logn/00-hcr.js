/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/13-logn-config/00-hcr", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have h.cr as the last parameter of the GET beacon URL (if ResourceTiming is enabled)", function() {
		if (t.isResourceTimingSupported()) {
			var b = t.findResourceTimingBeacon();
			assert.isTrue(/h\.cr=[a-zA-Z0-9]+$/.test(b.name));
		}
		else {
			this.skip();
		}
	});
});
