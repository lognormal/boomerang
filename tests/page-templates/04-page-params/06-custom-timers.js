/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/06-custom-timers", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done){
		t.validateBeaconWasSent(done);
	});

	it("Should take as long as the img.jpg (if NavigationTiming is supported)", function(){
		if (t.isNavigationTimingSupported() && t.isResourceTimingSupported()) {
			t.validateBeaconWasSentAfter(0, "img.jpg", 3000, 0, 30000, true);
		}
		else {
			return this.skip();
		}
	});

	it("Shouldn't have a load time (if NavigationTiming is not supported)", function(){
		if (!t.isNavigationTimingSupported()) {
			var b = tf.lastBeacon();
			assert.isUndefined(b.t_done);
			assert.equal(b["rt.start"], "none");
		}
		else {
			return this.skip();
		}
	});

	it("Should have the custom timer 1 - URL defined", function(){
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.closeTo(parseInt(timers["ctim.CT1"]), 3000, 100);
			assert.operator(b["ctim.CT1_st"], ">", 0);
		}
		else {
			return this.skip();
		}
	});

	it("Should have the custom timer 2 - XPath", function(){
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.closeTo(parseInt(timers["ctim.CT2"]), 3000, 100);
			assert.operator(b["ctim.CT2_st"], ">", 0);
		}
		else {
			return this.skip();
		}
	});

	it("Should have the custom timer 3 - QuerySelector", function(){
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.closeTo(parseInt(timers["ctim.CT3"]), 3000, 100);
			assert.operator(b["ctim.CT3_st"], ">", 0);
		}
		else {
			return this.skip();
		}
	});

	it("Should have the custom timer 4 - URL is Slowest", function(){
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.closeTo(parseInt(timers["ctim.CT4"]), 3000, 100);
			assert.operator(b["ctim.CT4_st"], ">", 0);
		}
		else {
			return this.skip();
		}
	});

	it("Shouldn't have the custom timer 5 - URL empty", function(){
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isUndefined(timers["ctim.CT5"]);
			assert.isUndefined(b["ctim.CT5_st"]);
		}
		else {
			return this.skip();
		}
	});

	it("Shouldn't have the custom timer 6 - No options", function(){
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isUndefined(timers["ctim.CT6"]);
			assert.isUndefined(b["ctim.CT6_st"]);
		}
		else {
			return this.skip();
		}
	});

	it("Should have the custom timer 7 - Parameter2 is Slowest", function(){
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.closeTo(parseInt(timers["ctim.CT7"]), 3000, 100);
			assert.operator(b["ctim.CT7_st"], ">", 0);
		}
		else {
			return this.skip();
		}
	});

	it("Should have the custom timer 8 - Start is navigationStart", function(){
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.closeTo(timers["ctim.CT8"], 3400, 500);  // account for some time before request is started
			assert.equal(b["ctim.CT8_st"], 0);
		}
		else {
			return this.skip();
		}
	});
});
