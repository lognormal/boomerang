/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["02-custom-timers"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have only sent one beacon", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 1);
	});

	describe("Beacon 1", function() {
		var i = 0;
		it("Should be missing the custom timer 0 - NavigationTiming - because it's handled on the server", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom0);
		});

		it("Should have the custom timer 1 - JavaScript variable - having been updated by the Angular App", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom1, 11);
		});

		it("Should have the custom timer 2 - JavaScript function - having been updated by the Angular App", function() {
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

		it("Should be missing custom timer 4 - JavaScript variable", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom4);
		});

		it("Should be missing custom timer 5 - UserTiming", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom5);
		});

		it("Should have the custom timer 6 - ResourceTiming (if ResourceTiming is supported)", function() {
			if (t.isResourceTimingSupported()) {
				var b = tf.beacons[i];
				assert.isDefined(t.parseTimers(b.t_other).custom6, "Should have custom timer 6");
				assert.isTrue(t.parseTimers(b.t_other).custom6 > 0, "Should have custom timer 6 > 0");
			}
			else {
				return this.skip();
			}
		});

		it("Should have the custom timer 7 - ResourceTiming (if ResourceTiming is supported)", function() {
			if (t.isResourceTimingSupported()) {
				var b = tf.beacons[i];
				assert.isDefined(t.parseTimers(b.t_other).custom7, "Should have custom timer 7");
				assert.isTrue(t.parseTimers(b.t_other).custom7 > 0, "Should have custom timer 7 > 0");
			}
			else {
				return this.skip();
			}
		});

		it("Should have the custom timer 6 be less than custom timer 7 - ResourceTiming (if ResourceTiming is supported)", function() {
			if (t.isResourceTimingSupported()) {
				var b = tf.beacons[i];
				assert.isDefined(t.parseTimers(b.t_other).custom6, "Should have custom timer 6");
				assert.isDefined(t.parseTimers(b.t_other).custom7, "Should have custom timer 7");
				assert.isTrue(t.parseTimers(b.t_other).custom6 < t.parseTimers(b.t_other).custom7, "Should have custom timer 6 < custom timer 7");
			}
			else {
				return this.skip();
			}
		});

		it("Should be missing custom timer 8 - ResourceTiming", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom8);
		});
	});
};
