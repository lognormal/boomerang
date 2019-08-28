/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/20-painttiming/01-hidden-onload", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should not have set pt.fp", function() {
		assert.isUndefined(tf.lastBeacon()["pt.fp"]);
	});

	it("Should not have set pt.fcp", function() {
		assert.isUndefined(tf.lastBeacon()["pt.fcp"]);
	});

	it("Should have set pt.hid (if PaintTiming is supported)", function() {
		if (!t.isPaintTimingSupported()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon()["pt.hid"], 1);
	});
});
