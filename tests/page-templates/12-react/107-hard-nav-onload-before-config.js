/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/12-react/107-hard-nav-onload-before-config ", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	t.configureTestEnvironment();

	it("Should pass basic beacon validation", function(done) {
		if (t.isMutationObserverSupported() && t.isNavigationTimingSupported()) {
			t.validateBeaconWasSent(done);
		}
		else {
			done();
		}
	});

	it("Should have sent one beacon", function() {
		if (t.isMutationObserverSupported() && t.isNavigationTimingSupported()) {
			assert.equal(tf.beacons.length, 1);
		}
	});

	it("Should have sent the first beacon as http.initiator = spa_hard", function() {
		if (t.isMutationObserverSupported() && t.isNavigationTimingSupported()) {
			assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
		}
	});

	it("Should have sent the first beacon as spa.missed", function() {
		if (t.isMutationObserverSupported() && t.isNavigationTimingSupported()) {
			assert.isDefined(tf.beacons[0]["spa.missed"]);
		}
	});

	it("Should have first beacon with a t_done of regular NavTiming Page Load time", function() {
		if (t.isMutationObserverSupported() && t.isNavigationTimingSupported()) {
			var p = BOOMR.getPerformance();
			var pt = p.timing;
			var pageLoad = (pt.loadEventStart - pt.navigationStart);
			assert.equal(tf.beacons[0].t_done, pageLoad);
		}
	});
});
