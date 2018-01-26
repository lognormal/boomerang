/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/20-painttiming/00-onload", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have set pt.fp (if PaintTiming is supported and happened by load)", function() {
		if (!t.isPaintTimingSupported()) {
			return this.skip();
		}

		var pt = BOOMR.utils.arrayFind(performance.getEntriesByType("paint"), function(entry) {
			return entry.name === "first-paint";
		});

		if (!pt || pt.startTime > parseInt(tf.lastBeacon().t_done, 10)) {
			// might happen if there haven't been any paints by beacon, like if it
			// loaded in the background
			return this.skip();
		}

		// validation of First Paint
		assert.isNumber(tf.lastBeacon()["pt.fp"]);
		assert.operator(parseInt(tf.lastBeacon()["pt.fp"], 10), ">=", 0);
		assert.equal(tf.lastBeacon()["pt.fp"], Math.floor(pt.startTime));
	});

	it("Should have set pt.fcp (if PaintTiming is supported and happened by load)", function() {
		if (!t.isPaintTimingSupported()) {
			return this.skip();
		}

		var pt = BOOMR.utils.arrayFind(performance.getEntriesByType("paint"), function(entry) {
			return entry.name === "first-contentful-paint";
		});

		if (!pt || pt.startTime > parseInt(tf.lastBeacon().t_done, 10)) {
			// might happen if there haven't been any paints by beacon, like if it
			// loaded in the background
			return this.skip();
		}

		// validation of First Contentful Paint
		assert.isNumber(tf.lastBeacon()["pt.fcp"]);
		assert.operator(parseInt(tf.lastBeacon()["pt.fcp"], 10), ">=", 0);
		assert.operator(parseInt(tf.lastBeacon()["pt.fcp"], 10), ">=", parseInt(tf.lastBeacon()["pt.fp"], 10));
		assert.equal(tf.lastBeacon()["pt.fcp"], Math.floor(pt.startTime));
	});
});
