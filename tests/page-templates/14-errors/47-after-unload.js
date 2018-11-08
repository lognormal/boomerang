/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/14-errors/47-after-unload", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have not generated an error after Boomerang was unloaded", function() {
		assert.isUndefined(window.onerrorHit);
	});
});
