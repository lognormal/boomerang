/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["23-hard-wait-for-onload"] = function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should have only sent one beacon", function() {
		// only one beacon should've been sent
		assert.equal(tf.beacons.length, 1);
	});

	it("Should have been a spa_hard beacon (if MutationObserver and NavigationTiming are supported)", function() {
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
		}
	});

	it("Should have fired after onload (if MutationObserver and NavigationTiming are supported)", function() {
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			var b = tf.beacons[0];

			assert.notEqual(b.nt_load_st, 0, "performance.timing.loadEventStart should not be 0");

			assert.operator(b.t_done, ">=", b.nt_load_st - b.nt_nav_st);
		}
	});
};
