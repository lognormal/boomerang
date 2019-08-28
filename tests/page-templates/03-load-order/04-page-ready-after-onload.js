/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/03-load-order/04-page-ready-after-onload", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var assert = chai.assert;

	it("Should have sent a beacon", function(done) {
		t.ensureBeaconCount(done, 1);
	});

	it("Should have a load time over 3 seconds (if NavigationTiming is supported)", function() {
		var b = tf.lastBeacon();

		if (!b.t_done) {
			// non-NavTiming browsers won't know how to calculate Page Load time
			return this.skip();
		}

		assert.operator(b.t_done, ">=", 3000);

		// should be around window.pageReadyTs
		assert.closeTo(b.t_done, window.pageReadyTs - window.performance.timing.navigationStart, 200);
	});

	it("Should have set pr=1", function() {
		var b = tf.lastBeacon();

		assert.equal(b.pr, "1");
	});
});
