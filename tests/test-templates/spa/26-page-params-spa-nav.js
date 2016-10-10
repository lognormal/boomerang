/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["26-page-params-spa-nav"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent three beacons", function() {
		assert.equal(tf.beacons.length, 4);
	});

	it("Should have sent the first beacon as http.initiator = spa_hard", function() {
		assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
	});

	it("Should have beacon 1 with CT1 as a spa_hard and a timing of 3000", function() {
		if (t.isMutationObserverSupported() || t.isResourceTimingSupported()) {
			var b = tf.beacons[0];
			assert.equal(b["http.initiator"], "spa_hard");
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT1"], "ctim.CT1 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT1"]), 3000, 100);
		}
	});

	it("Should have beacon 2 with CT2 as a spa and a timing of 1000", function() {
		if (t.isMutationObserverSupported() || t.isResourceTimingSupported()) {
			var b = tf.beacons[1];
			assert.equal(b["http.initiator"], "spa");
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT2"], "ctim.CT2 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT2"]), 1000, 100);
		}
	});

	it("Should have beacon 3 with CT3 as a spa and a timing of 1000", function() {
		var b = tf.beacons[3];
		assert.equal(b["http.initiator"], "xhr");

		// Since AutoXHR only waits for subsequent elements when MutationObserver is supported:
		if (t.isMutationObserverSupported()) {
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT3"], "ctim.CT3 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT3"]), 1000, 100);
		}
		else {
			assert.closeTo(b.t_done, 100, 50);
		}
	});
};
