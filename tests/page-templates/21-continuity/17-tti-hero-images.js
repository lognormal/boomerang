/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/17-tti-hero-images", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have set the Visually Ready to when the last Hero Image was loaded (c.tti.vr) (if ResourceTiming is supported)", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();

			var vr = window.heroImagesLoaded;

			var st = parseInt(b["rt.tstart"], 10);

			assert.isDefined(b["c.tti.vr"]);
			assert.closeTo(parseInt(b["c.tti.vr"], 10), vr - st, 20);
		}
	});

	it("Should have set the Time to Interactive (c.tti)", function() {
		var b = tf.lastBeacon();

		if (t.isNavigationTimingSupported()) {
			var workDoneTs = window.timeToInteractive - performance.timing.navigationStart;

			assert.isDefined(b["c.tti"]);
			assert.closeTo(parseInt(b["c.tti"], 10), workDoneTs, 100);
		}
	});

	it("Should have set the Time to Hero Images (c.tti.hi)", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();

			var vr = window.heroImagesLoaded;

			var st = parseInt(b["rt.tstart"], 10);

			assert.isDefined(b["c.tti.hi"]);
			assert.closeTo(parseInt(b["c.tti.hi"], 10), vr - st, 20);
		}
	});
});
