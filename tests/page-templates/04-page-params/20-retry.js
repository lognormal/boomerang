/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/20-retry", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done){
		t.validateBeaconWasSent(done);
	});

	it("Should have the custom timer 1 - URL defined", function(){
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT1"]);
			assert.operator(parseInt(timers["ctim.CT1"]), ">=", 0);
		}
		else {
			return this.skip();
		}
	});

	it("Should have the custom timer 2 - UserTiming", function(){
		if (t.isUserTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT2"]);
			assert.operator(parseInt(timers["ctim.CT2"]), ">=", 500);
		}
		else {
			return this.skip();
		}
	});

	it("Should have the custom timer 3 - JavaScript var", function(){
		var b = tf.lastBeacon();
		var timers = t.parseTimers(b.t_other);
		assert.isDefined(timers["ctim.CT3"]);
		assert.equal(parseInt(timers["ctim.CT3"]), 1000);
	});

	it("Should have the custom metric 1 - JavaScript var", function(){
		var b = tf.lastBeacon();
		assert.isDefined(b["cmet.CM1"]);
		assert.equal(parseInt(b["cmet.CM1"]), 100);
	});

	it("Should have the custom dimension 1 - JavaScript var", function(){
		var b = tf.lastBeacon();
		assert.isDefined(b["cdim.CD1"]);
		assert.equal(b["cdim.CD1"], "true");
	});

	it("Should have the Page Group - JavaScript var", function(){
		var b = tf.lastBeacon();
		assert.equal(b["h.pg"], "PG1");
	});

	it("Should have the A/B test - JavaScript var", function(){
		var b = tf.lastBeacon();
		assert.equal(b["h.ab"], "A");
	});
});
