/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,describe,it,assert*/

describe("e2e/12-react/109-hard-nav-resource-group-xhr-detect", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent one beacon", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 1);
	});

	it("Should have the first beacon as spa_hard beacon", function() {
		var b = tf.beacons[0];
		assert.equal(b["http.initiator"], "spa_hard");
	});

	it("Should have a custom timer(ctim.CT1) value of 1s for the single image loaded", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT1"], "ctim.CT1 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT1"]), 1000, 100);
		}
	});
});

