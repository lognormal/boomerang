/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["26-page-params-spa-nav"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent four beacons", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 4);
	});

	//
	// Beacon 1
	//

	describe("Beacon 1 (spa_hard)", function() {
		var i = 0;

		it("Should have sent the first beacon as http.initiator = spa_hard", function() {
			assert.equal(tf.beacons[i]["http.initiator"], "spa_hard");
		});

		it("Should have the page group set", function() {
			var b = tf.beacons[i];
			assert.equal(b["h.pg"], "home");
		});

		it("Should have the custom metric 1 - JavaScript var - having been updated by the SPA app", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet1, 11);
		});

		it("Should have the custom metric 2 - JavaScript function - having been updated by the SPA app", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet2, 22);
		});

		it("Should be missing custom metric 3 - undefined JavaScript var", function() {
			var b = tf.beacons[i];
			assert.isUndefined(b.cmet3);
		});

		it("Should have the custom metric 4 - XPath - having been added by the SPA app", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet4, 444.44);
		});

		it("Should have the custom metric 5 - URL", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet5, 1);
		});

		it("Should be missing the custom timer 0 - NavigationTiming - because it's handled on the server", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom0);
		});

		it("Should have the custom timer 1 - JavaScript variable - having been updated by the SPA app", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom1, 11);
		});

		it("Should have the custom timer 2 - JavaScript function - having been updated by the SPA app", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom2, 22);
		});

		it("Should have the custom timer 3 - UserTiming (if UserTiming is supported)", function() {
			if (t.isUserTimingSupported()) {
				var b = tf.beacons[i];
				assert.isTrue(t.parseTimers(b.t_other).custom3 > 0);
			}
			else {
				return this.skip();
			}
		});

		it("Should be missing the custom timer 3 - UserTiming (if UserTiming is not supported)", function() {
			if (!t.isUserTimingSupported()) {
				var b = tf.beacons[i];
				assert.isUndefined(t.parseTimers(b.t_other).custom3);
			}
			else {
				return this.skip();
			}
		});

		it("Should be missing custom timer 4 - JavaScript var", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom4);
		});

		it("Should be missing custom timer 5 - UserTiming", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom5);
		});

		it("Should have custom timer 6 timing of 3000 (if MutationObserver is supported)", function() {
			// If we don't have MutationObserver, the spa_hard beacon will fire before our resource was loaded
			if (t.isMutationObserverSupported()) {
				var b = tf.beacons[i];
				var timers = t.parseTimers(b.t_other);
				assert.isDefined(timers.custom6, "custom6 - Should exist on the beacon");
				assert.closeTo(timers.custom6, 3000, 200);
				assert.operator(b.custom6_st, ">", 0);  // TODO: better check
			}
			else {
				return this.skip();
			}
		});

		it("Should be missing custom timer 7", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom7);
		});

		it("Should be missing custom timer 8", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom8);
		});

		it("Should be missing custom timer 9", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom9);
		});

		it("Should have the custom timer 10 - ResourceTiming (if ResourceTiming and MutationObserver is supported)", function() {
			// If we don't have MutationObserver, the spa_hard beacon will fire before our resource was loaded
			if (t.isResourceTimingSupported() && t.isMutationObserverSupported()) {
				var b = tf.beacons[i];
				assert.isDefined(t.parseTimers(b.t_other).custom10, "Should have custom timer 10");
				assert.isTrue(t.parseTimers(b.t_other).custom10 > 0, "Should have custom timer 10 > 0");
				// TODO: check value
				assert.operator(b.custom10_st, ">", 0);  // TODO: better check
			}
			else {
				return this.skip();
			}
		});

		it("Should have the custom timer 11 - ResourceTiming (if ResourceTiming and MutationObserver is supported)", function() {
			// If we don't have MutationObserver, the spa_hard beacon will fire before our resource was loaded
			if (t.isResourceTimingSupported() && t.isMutationObserverSupported()) {
				var b = tf.beacons[i];
				assert.isDefined(t.parseTimers(b.t_other).custom11, "Should have custom timer 11");
				assert.isTrue(t.parseTimers(b.t_other).custom11 > 0, "Should have custom timer 11 > 0"); // TODO: check value
				assert.equal(b.custom11_st, 0);
			}
			else {
				return this.skip();
			}
		});

		it("Should have the custom timer 10 be less than custom timer 11 - ResourceTiming (if ResourceTiming is supported and MutationObserver is supported)", function() {
			// If we don't have MutationObserver, the spa_hard beacon will fire before our resource was loaded
			if (t.isResourceTimingSupported() && t.isMutationObserverSupported()) {
				var b = tf.beacons[i];
				assert.isDefined(t.parseTimers(b.t_other).custom10, "Should have custom timer 10");
				assert.isDefined(t.parseTimers(b.t_other).custom11, "Should have custom timer 11");
				assert.isTrue(t.parseTimers(b.t_other).custom10 < t.parseTimers(b.t_other).custom11, "Should have custom timer 10 < custom timer 11");
			}
			else {
				return this.skip();
			}
		});

		it("Should be missing custom timer 12 - ResourceTiming", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom12);
		});
	});

	//
	// Beacon 2
	//

	describe("Beacon 2 (spa)", function() {
		var i = 1;

		it("Should have sent the second beacon as http.initiator = spa", function() {
			assert.equal(tf.beacons[i]["http.initiator"], "spa");
		});

		it("Should have the page group set", function() {
			var b = tf.beacons[i];
			assert.equal(b["h.pg"], "widget1");
		});

		it("Should have the custom metric 1 - JavaScript var - having been updated by the SPA app", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet1, 1);
		});

		it("Should have the custom metric 2 - JavaScript function - having been updated by the SPA app", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet2, 10);
		});

		it("Should be missing custom metric 3 - undefined JavaScript var", function() {
			var b = tf.beacons[i];
			assert.isUndefined(b.cmet3);
		});

		it("Should have the custom metric 4 - XPath - having been added by the SPA app", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet4, 11.11);
		});

		it("Should have the custom metric 5 - URL", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet5, 1);
		});

		it("Should be missing the custom timer 0 - NavigationTiming - because it's handled on the server", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom0);
		});

		it("Should have the custom timer 1 - JavaScript variable - having been updated by the SPA app", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom1, 1);
		});

		it("Should have the custom timer 2 - JavaScript function - having been updated by the SPA app", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom2, 10);
		});

		it("Should be missing the custom timer 3 - UserTiming - only set on the home page nav", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom3);
		});

		it("Should be missing custom timer 4 - JavaScript var", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom4);
		});

		it("Should be missing custom timer 5 - UserTiming", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom5);
		});

		it("BUG: Should be missing custom timer 6", function() {
			return this.skip(); // TODO: this test reveals a bug, see https://github.com/SOASTA/soasta-boomerang/issues/626
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom6);
		});

		it("Should have custom timer 7 timing of 1000 (if MutationObserver is supported)", function() {
			// If we don't have MutationObserver, the spa beacon will fire before our resource was loaded
			if (t.isMutationObserverSupported()) {
				var b = tf.beacons[i];
				var timers = t.parseTimers(b.t_other);
				assert.isDefined(timers.custom7, "custom7 - Should exist on the beacon");
				assert.closeTo(timers.custom7, 1000, 200);
				assert.operator(b.custom7_st, ">", 0);  // TODO: better check
			}
			else {
				return this.skip();
			}
		});

		it("Should have custom timer 8 (if MutationObserver is supported)", function() {
			// If we don't have MutationObserver, the spa beacon will fire before our resource was loaded
			if (t.isMutationObserverSupported()) {
				var b = tf.beacons[i];
				var timers = t.parseTimers(b.t_other);
				assert.isDefined(timers.custom7, "custom8 - Should exist on the beacon");
				// TODO: check value of timers.custom8
				assert.operator(b.custom8_st, ">", 0);  // TODO: better check
			}
			else {
				return this.skip();
			}
		});

		it("Should have custom timer 7 less than timer 8 (if MutationObserver is supported)", function() {
			// If we don't have MutationObserver, the spa beacon will fire before our resource was loaded
			if (t.isMutationObserverSupported()) {
				var b = tf.beacons[i];
				var timers = t.parseTimers(b.t_other);
				assert.isTrue(timers.custom7 < timers.custom8, "custom7 should be less than custom8");
			}
			else {
				return this.skip();
			}
		});

		it("Should be missing custom timer 9", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom9);
		});

		it("Should be missing custom timers 10 to 12", function() {
			var b = tf.beacons[i];
			for (var j = 9; j < 12; j++) {
				assert.isUndefined(t.parseTimers(b.t_other)["custom" + j], "custom" + j + " should not exist on beacon");
			}
		});
	});

	//
	// Beacon 3
	//

	describe("Beacon 3 (spa)", function() {
		var i = 2;

		it("Should have sent the third beacon as http.initiator = spa", function() {
			assert.equal(tf.beacons[i]["http.initiator"], "spa");
		});

		it("Should have the page group set", function() {
			var b = tf.beacons[i];
			assert.equal(b["h.pg"], "home");
		});

		it("Should have the custom metric 1 - JavaScript var - having been updated by the SPA app", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet1, 11);
		});

		it("Should have the custom metric 2 - JavaScript function - having been updated by the SPA app", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet2, 22);
		});

		it("Should be missing custom metric 3 - undefined JavaScript var", function() {
			var b = tf.beacons[i];
			assert.isUndefined(b.cmet3);
		});

		it("Should have the custom metric 4 - XPath - having been added by the SPA app", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet4, 444.44);
		});

		it("Should have the custom metric 5 - URL", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet5, 1);
		});

		it("Should be missing the custom timer 0 - NavigationTiming - because it's handled on the server", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom0);
		});

		it("Should have the custom timer 1 - JavaScript variable - having been updated by the SPA app", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom1, 11);
		});

		it("Should have the custom timer 2 - JavaScript function - having been updated by the SPA app", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom2, 22);
		});

		it("Should have the custom timer 3 - UserTiming (if UserTiming is supported)", function() {
			if (t.isUserTimingSupported()) {
				var b = tf.beacons[i];
				assert.isTrue(t.parseTimers(b.t_other).custom3 > 0);
			}
			else {
				return this.skip();
			}
		});

		it("Should be missing the custom timer 3 - UserTiming (if UserTiming is not supported)", function() {
			if (!t.isUserTimingSupported()) {
				var b = tf.beacons[i];
				assert.isUndefined(t.parseTimers(b.t_other).custom3);
			}
			else {
				return this.skip();
			}
		});

		it("Should be missing custom timer 4 - JavaScript var", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom4);
		});

		it("Should be missing custom timer 5 - UserTiming", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom5);
		});

		it("BUG: Should be missing custom timer 6", function() {
			return this.skip(); // TODO: this test reveals a bug, see https://github.com/SOASTA/soasta-boomerang/issues/626
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom6);
		});

		it("BUG: Should be missing custom timer 7", function() {
			return this.skip();  // TODO: this test reveals a bug, see https://github.com/SOASTA/soasta-boomerang/issues/626
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom7);
		});

		it("BUG: Should be missing custom timer 8", function() {
			return this.skip();  // TODO: this test reveals a bug, see https://github.com/SOASTA/soasta-boomerang/issues/626
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom8);
		});

		it("Should be missing custom timer 9", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom9);
		});

		it("Should have the custom timer 10 - ResourceTiming (if ResourceTiming and MutationObserver is supported)", function() {
			// If we don't have MutationObserver, the spa beacon will fire before our resource was loaded
			if (t.isResourceTimingSupported() && t.isMutationObserverSupported()) {
				var b = tf.beacons[i];
				assert.isDefined(t.parseTimers(b.t_other).custom10, "Should have custom timer 10");
				assert.isTrue(t.parseTimers(b.t_other).custom10 > 0, "Should have custom timer 10 > 0");
				// TODO: check value
				assert.operator(b.custom10_st, ">", 0);  // TODO: better check
			}
			else {
				return this.skip();
			}
		});

		it("Should have the custom timer 11 - ResourceTiming (if ResourceTiming and MutationObserver is supported)", function() {
			// If we don't have MutationObserver, the spa beacon will fire before our resource was loaded
			if (t.isResourceTimingSupported() && t.isMutationObserverSupported()) {
				var b = tf.beacons[i];
				assert.isDefined(t.parseTimers(b.t_other).custom11, "Should have custom timer 11");
				assert.isTrue(t.parseTimers(b.t_other).custom11 > 0, "Should have custom timer 11 > 0"); // TODO: check value
				assert.equal(b.custom11_st, 0);
			}
			else {
				return this.skip();
			}
		});

		it("Should have the custom timer 10 be less than custom timer 11 - ResourceTiming (if ResourceTiming and MutationObserver is supported)", function() {
			// If we don't have MutationObserver, the spa beacon will fire before our resource was loaded
			if (t.isResourceTimingSupported() && t.isMutationObserverSupported()) {
				var b = tf.beacons[i];
				assert.isDefined(t.parseTimers(b.t_other).custom10, "Should have custom timer 10");
				assert.isDefined(t.parseTimers(b.t_other).custom11, "Should have custom timer 11");
				assert.isTrue(t.parseTimers(b.t_other).custom10 < t.parseTimers(b.t_other).custom11, "Should have custom timer 10 < custom timer 11");
			}
			else {
				return this.skip();
			}
		});

		it("Should be missing custom timer 12 - ResourceTiming", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom12);
		});
	});

	//
	// Beacon 4
	//

	describe("Beacon 4 (xhr)", function() {
		var i = 3;

		it("Should have sent the fourth beacon as http.initiator = xhr", function() {
			assert.equal(tf.beacons[i]["http.initiator"], "xhr");
		});

		it("Should not have the page group set", function() {
			var b = tf.beacons[i];
			assert.isUndefined(b["h.pg"]);
		});

		// TODO: check custom metrics

		it("Should be missing custom timers 0 to 6", function() {
			var b = tf.beacons[i];
			for (var j = 0; j < 6; j++) {
				assert.isUndefined(t.parseTimers(b.t_other)["custom" + j], "custom" + j + " should not exist on beacon");
			}
		});

		it("BUG: Should be missing custom timers 7 to 8", function() {
			return this.skip();  // TODO: this test reveals a bug, see https://github.com/SOASTA/soasta-boomerang/issues/626
			var b = tf.beacons[i];
			for (var j = 0; j < 8; j++) {
				assert.isUndefined(t.parseTimers(b.t_other)["custom" + j], "custom" + j + " should not exist on beacon");
			}
		});

		it("BUG: Should have custom timer 9 timing of 1000", function() {
			return this.skip();  // TODO: this test reveals a bug, see https://github.com/SOASTA/soasta-boomerang/issues/626
			var b = tf.beacons[i];
			// Since AutoXHR only waits for subsequent elements when MutationObserver is supported:
			if (t.isMutationObserverSupported()) {
				var timers = t.parseTimers(b.t_other);
				assert.isDefined(timers.custom9, "custom9 - Should exist on the beacon!");
				assert.closeTo(timers.custom9, 1000, 200);
			}
			else {
				assert.closeTo(b.t_done, 100, 50);
			}
		});

		it("Should be missing custom timers 10 to 12", function() {
			var b = tf.beacons[i];
			for (var j = 9; j < 12; j++) {
				assert.isUndefined(t.parseTimers(b.t_other)["custom" + j], "custom" + j + " should not exist on beacon");
			}
		});
	});
};
