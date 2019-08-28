/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/12-react/101-hard-nav-onload-no-xhr", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent one beacon", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 1);
	});

	it("Should have sent the beacon as http.initiator = spa_hard", function() {
		assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
	});

	it("Should have beacon with a t_done of regular NavTiming Page Load time", function() {
		if (t.isNavigationTimingSupported()) {
			var p = BOOMR.getPerformance();
			var pt = p.timing;
			var pageLoad = (pt.loadEventStart - pt.navigationStart);
			assert.closeTo(tf.beacons[0].t_done, pageLoad, 1);
		}
		else {
			// page load should be around the time of the img download - the difference between navStart and t_start
			// hard to estimate, so skip for now
			this.skip();
		}
	});
});
