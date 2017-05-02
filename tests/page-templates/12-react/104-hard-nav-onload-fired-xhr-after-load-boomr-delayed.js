/*eslint-env mocha*/
/*global BOOMR_test*/
describe("e2e/12-react/104-hard-nav-onload-fired-xhr-after-load-boomr-delayed", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

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

	it("Should have first beacon with a t_done of approximately NavTiming through the last IMG", function() {
		if (t.isMutationObserverSupported() && t.isNavigationTimingSupported() && t.isResourceTimingSupported()) {
			var img = t.findFirstResource("img.jpg&id=xhr");
			assert.closeTo(tf.beacons[0].t_done, img.responseEnd, 50);
		}
	});
});
