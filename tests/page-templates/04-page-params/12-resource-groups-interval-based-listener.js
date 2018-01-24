/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,assert*/

describe("e2e/04-page-params/12-resource-groups-interval-based-listener", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have the custom timer 1 - Only timeout based interval attaching to element added to children of container", function() {
		if (!window.MutationObserver && !window.performance) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT1"], "ctim.CT1 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT1"]), 1000, 200);
		}
		else {
			return this.skip();
		}
	});

	it("Should have the custom timer 2 - Only timeout based interval attaching to elements matching the URL in the ResourceURL", function() {
		if (!window.MutationObserver && !window.performance) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT2"], "ctim.CT2 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT2"]), 1000, 200);
		}
		else {
			return this.skip();
		}
	});

	it("Should have the custom timer 3 - Resource Node is found and it's an image", function() {
		if (!window.MutationObserver && !window.performance) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT3"], "ctim.CT3 - Does not exist on the beacon!");
			assert.closeTo(parseInt(timers["ctim.CT3"]), 1500, 300);
		}
		else {
			return this.skip();
		}
	});
});
