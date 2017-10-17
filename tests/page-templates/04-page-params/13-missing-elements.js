/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,assert*/

describe("e2e/04-page-params/13-missing-elements", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should NOT have custom timer 1 - Element does not exist on page, missing criteria", function() {
		var b = tf.lastBeacon();
		var timers = t.parseTimers(b.t_other);
		assert.isUndefined(timers["ctim.CT1"], "ctim.CT1 - Exists on the beacon!");
	});

	it("Should have custom timer 2 - Script Resource is on page (if ResourceTiming is supported)", function() {
		if (!t.isResourceTimingSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();
		var timers = t.parseTimers(b.t_other);
		assert.isDefined(timers["ctim.CT2"], "ctim.CT2 - Does not exist on the beacon!");
	});
});
