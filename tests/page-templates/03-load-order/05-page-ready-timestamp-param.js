/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/03-load-order/05-page-ready-timestamp-param", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var assert = chai.assert;

	it("Should have sent a beacon", function(done) {
		t.ensureBeaconCount(done, 1);
	});

	it("Should have a load time over 1 second (if NavigationTiming is supported)", function() {
		var b = tf.lastBeacon();

		if (!b.t_done) {
			// non-NavTiming browsers won't know how to calculate Page Load time
			return this.skip();
		}

		assert.operator(b.t_done, ">=", 1000);

		// should be window.pageReadyTs
		assert.equal(b.t_done, window.pageReadyTs - window.performance.timing.navigationStart);
	});

	it("Should have a end timestamp equal to our simulated page ready timestamp", function() {
		var b = tf.lastBeacon();
		assert.equal(b["rt.end"], window.pageReadyTs);
	});

	it("Should have set pr=1", function() {
		var b = tf.lastBeacon();

		assert.equal(b.pr, "1");
	});
});
