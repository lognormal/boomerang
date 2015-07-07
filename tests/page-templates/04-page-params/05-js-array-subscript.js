/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/00-custom-metrics", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have the custom metric 1 - JavaScript var with subscript", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet1, 111);
	});

	it("Should have the custom metric 2 - JavaScript var sub-object and subscript", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet2, 222);
	});

	it("Should have the custom metric 3 - Complex JavaScript var with sub-objects and subscripts", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet3, 333);
	});

	it("Should have the custom metric 4 - JavaScript var with subscript function", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet4, 444);
	});

	it("Should have the custom dimension 1 - JavaScript var with subscript", function() {
		var b = tf.lastBeacon();
		assert.equal(b["cdim.JS1"], "111");
	});

	it("Should have the custom dimension 2 - JavaScript var sub-object and subscript", function() {
		var b = tf.lastBeacon();
		assert.equal(b["cdim.JS2"], "222");
	});

	it("Should have the custom dimension 3 - Complex JavaScript var with sub-objects and subscripts", function() {
		var b = tf.lastBeacon();
		assert.equal(b["cdim.JS3"], "333");
	});

	it("Should have the custom dimension 4 - JavaScript var with subscript function", function() {
		var b = tf.lastBeacon();
		assert.equal(b["cdim.JS4"], "444");
	});

	it("Should have the custom timer 1 - JavaScript var with subscript", function() {
		var b = tf.lastBeacon();
		assert.equal(t.parseTimers(b.t_other).custom0, 111);
	});

	it("Should have the custom timer 2 - JavaScript var sub-object and subscript", function() {
		var b = tf.lastBeacon();
		assert.equal(t.parseTimers(b.t_other).custom1, 222);
	});

	it("Should have the custom timer 3 - Complex JavaScript var with sub-objects and subscripts", function() {
		var b = tf.lastBeacon();
		assert.equal(t.parseTimers(b.t_other).custom2, 333);
	});

	it("Should have the custom timer 4 - JavaScript var with subscript function", function() {
		var b = tf.lastBeacon();
		assert.equal(t.parseTimers(b.t_other).custom3, 444);
	});

	it("Should have the A/B test", function() {
		var b = tf.lastBeacon();
		assert.equal(b["h.ab"], 111);
	});
});
