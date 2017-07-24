/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,assert*/

describe("e2e/04-page-params/08-resource-groups", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have the custom timer 1 - RG with XPath", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT1"], "ctim.CT1 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT1"]), 1000, 100);
		}
	});

	it("Should have the custom timer 2 - RG with QuerySelector", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT2"], "ctim.CT2 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT2"]), 1000, 100);
		}
	});

	it("Should have the custom timer 3 - RG with Resource URL", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT3"], "ctim.CT3 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT3"]), 1000, 100);
		}
	});

	it("Should have the custom timer 4 - RG Container with XPathh", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT4"], "ctim.CT4 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT4"]), 1000, 200);
		}
	});

	it("Should have the custom timer 5 - RG Container with QuerySelector", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT5"], "ctim.CT5 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT5"]), 1000, 100);
		}
	});

	it("Should have the custom timer 6 - RG Container ith XPath", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isUndefined(timers["ctim.CT6"], "ctim.CT6 - Is not supposed to be on the beacon!");
		}
	});

	it("Should have the custom timer 7 - RG is not on the beacon missing queryselector element", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isUndefined(timers["ctim.CT7"], "ctim.CT7 - Is not supposed to be on the beacon!");
		}
	});

	it("Should have the custom timer 8 - RG is not on the beacon missing resource URL", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isUndefined(timers["ctim.CT8"], "ctim.CT8 - Is not supposed to be on the beacon!");
		}
	});

	it("Should have the custom timer 9 - RG is not on the beacon missing URLPattern", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isUndefined(timers["ctim.CT9"], "ctim.CT9 - Is not supposed to be on the beacon!");
		}
	});

	it("Should have the custom timer 10 - RG container with multiple resources based on XPath ", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT10"], "ctim.CT10 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT10"]), 1000, 200);
		}
	});

	it("Should have the custom timer 11 - RG container with multiple resources based on QuerySelector ", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT11"], "ctim.CT11 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT11"]), 1000, 175);
		}
	});

	it("Should have the custom timer 12 - RG container with multiple resources based on Resource URL", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT12"], "ctim.CT12 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT12"]), 2000, 175);
		}
	});

	it("Should have the custom timer 13 - RG URL matching the first URL", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT13"], "ctim.CT13 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT13"]), 1000, 175);
		}
	});

	it("Should have the custom timer 14 - RG matching 2 containers on page", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT14"], "ctim.CT14 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT14"]), 2000, 175);
		}
	});
});
