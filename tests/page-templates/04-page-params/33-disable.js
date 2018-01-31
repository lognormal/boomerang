/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/33-disable", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should not set a Page Group", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b["h.pg"]);
	});

	it("Should not set a A/B test", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b["h.ab"]);
	});

	it("Should not set a Custom Timer", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b["h.pg"]);
	});

	it("Should not set a Custom Metric", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b.cmet1);
	});

	it("Should not set a Custom Dimension", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b["cdim.JS1"]);
	});
});
