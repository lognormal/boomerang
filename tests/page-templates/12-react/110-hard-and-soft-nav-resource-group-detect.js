/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,describe,it*/

describe("e2e/12-react/110-hard-and-soft-nav-resource-group-detect", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent 3 beacons", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 3);
	});

	it("Should have the first beacon as spa_hard beacon", function() {
		var b = tf.beacons[0];
		assert.equal(b["http.initiator"], "spa_hard");
	});

	it("Should have a custom timer(ctim.CT1) value of 1s for the single image loaded", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.beacons[0];
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT1"], "ctim.CT1 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT1"]), 1000, 100);
		}
	});

	it("Should have the second beacon as spa beacon", function() {
		var b = tf.beacons[1];
		assert.equal(b["http.initiator"], "spa");
	});

	it("Should have a custom timer(ctim.CT1) on the second nav", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.beacons[1];
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT1"], "ctim.CT1 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT1"]), 1000, 100);
		}
	});
});

