/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/32-delayed-boomerang", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent one beacon", function(done) {
		t.ensureBeaconCount(done, 1);
	});

	//
	// Beacon types
	//
	it("Should have the beacon be a Page Load beacon", function() {
		var b = tf.beacons[0];
		assert.isUndefined(b["http.initiator"]);
	});

	it("Should have set the Time to Interactive Method (c.tti.m)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.tti.m"]);

		if (window.PerformanceLongTaskTiming) {
			assert.equal(b["c.tti.m"], "lt");
		}
		else if (window.requestAnimationFrame) {
			assert.equal(b["c.tti.m"], "raf");
		}
		else {
			assert.equal(b["c.tti.m"], "b");
		}
	});
});
