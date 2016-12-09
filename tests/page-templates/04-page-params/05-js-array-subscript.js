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

	it("Should have the custom metric 5 - Complex JavaScript with double subscripts", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet5, 555);
	});

	it("Should have the custom metric 6 - Complex JavaScript with double subscripts and string property identifier", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet6, 555);
	});

	it("Should have the custom metric 7 - Complex JavaScript with double subscripts and string property identifier (single quotes)", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet7, 555);
	});

	it("Should have the custom metric 8 - String property identifier (dots in key)", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet8, 555);
	});

	it("Should have the custom metric 9 - String property identifier (dashes in key)", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet9, 200);
	});

	it("Should have the custom metric 10 - String property identifier (commas in key)", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet10, 100);
	});

	it("Should NOT have the custom metric 11 - Tries to access index that is not available", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b.cmet11);
	});

	it("Should NOT have the custom metric 12 - Accessing array index as 'a'", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b.cmet12);
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

	it("Should have the custom dimension 5 - Complex JavaScript with double subscripts", function() {
		var b = tf.lastBeacon();
		assert.equal(b["cdim.JS5"], 555);
	});

	it("Should have the custom dimension 6 - Complex JavaScript with double subscripts and string property identifier", function() {
		var b = tf.lastBeacon();
		assert.equal(b["cdim.JS6"], 555);
	});

	it("Should have the custom dimension 7 - Complex JavaScript with double subscripts and string property identifier (single quotes)", function() {
		var b = tf.lastBeacon();
		assert.equal(b["cdim.JS7"], 555);
	});

	it("Should have the custom dimension 8 - String property identifier (dots in key)", function() {
		var b = tf.lastBeacon();
		assert.equal(b["cdim.JS8"], 555);
	});

	it("Should have the custom dimension 9 - String property identifier (dashes in key)", function() {
		var b = tf.lastBeacon();
		assert.equal(b["cdim.JS9"], 200);
	});

	it("Should have the custom dimension 10 - String property identifier (commas in key)", function() {
		var b = tf.lastBeacon();
		assert.equal(b["cdim.JS10"], 100);
	});

	it("Should NOT have the custom dimension 11 - Tries to access index that is not available", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b["cdim.JS11"]);
	});

	it("Should NOT have the custom dimension 12 - Accessing array index as 'a'", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b["cdim.JS12"]);
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

	it("Should have the custom timer 5 - Complex JavaScript with double subscripts", function() {
		var b = tf.lastBeacon();
		assert.equal(t.parseTimers(b.t_other).custom4, 555);
	});

	it("Should have the custom timer 6 - Complex JavaScript with double subscripts and string property identifier", function() {
		var b = tf.lastBeacon();
		assert.equal(t.parseTimers(b.t_other).custom5, 555);
	});

	it("Should have the custom timer 7 - Complex JavaScript with double subscripts and string property identifier (single quotes)", function() {
		var b = tf.lastBeacon();
		assert.equal(t.parseTimers(b.t_other).custom6, 555);
	});

	it("Should have the custom timer 8 - String property identifier (dots in key)", function() {
		var b = tf.lastBeacon();
		assert.equal(t.parseTimers(b.t_other).custom7, 555);
	});

	it("Should have the custom timer 9 - String property identifier (dashes in key)", function() {
		var b = tf.lastBeacon();
		assert.equal(t.parseTimers(b.t_other).custom8, 200);
	});

	it("Should have the custom timer 10 - String property identifier (commas in key)", function() {
		var b = tf.lastBeacon();
		assert.equal(t.parseTimers(b.t_other).custom9, 100);
	});

	it("Should NOT have the custom timer 11 - Tries to access index that is not available", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(t.parseTimers(b.t_other).custom10);
	});

	it("Should NOT have the custom timer 12 - Accessing array index as 'a'", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(t.parseTimers(b.t_other).custom11);
	});

	it("Should have the A/B test", function() {
		var b = tf.lastBeacon();
		assert.equal(b["h.ab"], 111);
	});
});
