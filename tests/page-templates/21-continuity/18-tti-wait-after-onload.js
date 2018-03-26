/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/18-tti-wait-after-onload", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have set the Visually Ready to First Paint or domContentLoadedEventEnd (c.tti.vr)", function() {
		var b = tf.lastBeacon();

		var vr = t.getFirstOrContentfulPaint();
		var p = window.performance;

		// domContentLoadedEventEnd
		if (p && p.timing && p.timing.domContentLoadedEventEnd) {
			vr = Math.max(vr, p.timing.domContentLoadedEventEnd);
		}

		if (vr) {
			var st = parseInt(b["rt.tstart"], 10);

			assert.isDefined(b["c.tti.vr"]);
			assert.closeTo(parseInt(b["c.tti.vr"], 10), vr - st, 20);
		}
	});

	it("Should have set the Time to Interactive (c.tti)", function() {
		var b = tf.lastBeacon();

		if (t.isNavigationTimingSupported()) {
			var workDoneTs = window.workDone - performance.timing.navigationStart;

			assert.isDefined(b["c.tti"]);
			assert.closeTo(parseInt(b["c.tti"], 10), workDoneTs, 100);
		}
	});
});
