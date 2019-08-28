/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/16-tti-framework-ready", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have set the Visually Ready to when .frameworkReady() was called (c.tti.vr) (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			var b = tf.lastBeacon();

			var vr = window.visuallyReady;
			var st = parseInt(b["rt.tstart"], 10);

			assert.isDefined(b["c.tti.vr"]);
			assert.closeTo(parseInt(b["c.tti.vr"], 10), vr - st, 20);
		}
	});

	it("Should have set the Time to Interactive (c.tti) (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			var b = tf.lastBeacon();

			var workDoneTs = window.timeToInteractive - performance.timing.navigationStart;

			assert.isDefined(b["c.tti"]);
			assert.closeTo(parseInt(b["c.tti"], 10), workDoneTs, 100);
		}
	});

	it("Should have set the Framework Ready (c.tti.fr) (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			var b = tf.lastBeacon();

			var vr = window.visuallyReady;
			var st = parseInt(b["rt.tstart"], 10);

			assert.isDefined(b["c.tti.fr"]);
			assert.closeTo(parseInt(b["c.tti.fr"], 10), vr - st, 20);
		}
	});
});
