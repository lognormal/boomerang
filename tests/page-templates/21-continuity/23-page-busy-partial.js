/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/23-page-busy-partial", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have set the Page Busy (c.b)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.b"]);
	});

	it("Should have set the Page Busy percentage", function() {
		var b = tf.lastBeacon();

		assert.operator(parseInt(b["c.b"], 10), ">=", 0);
		assert.operator(parseInt(b["c.b"], 10), "<=", 100);
	});

	it("Should have the Page Busy timeline (c.t.busy)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.busy"]);
		assert.operator(b["c.t.busy"].length, ">=", 1);
	});

	it("Should be able to calculate Page Busy (c.b) from the timeline (c.t.busy)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.busy"]);

		var buckets = BOOMR.plugins.Continuity.decompressBucketLog(b["c.t.busy"]);

		// count buckets
		var busyCount = 0;
		for (var i = 0; i < buckets.length; i++) {
			// add the partial percentage of busy
			busyCount += buckets[i] / 100;
		}

		// calculation is within 20% of c.b - we can't be exact, as the actual
		// c.b is calculated from each individual poll while c.t.busy has a
		// summarized timeline of each 100ms
		var calcBusy = Math.round(busyCount / buckets.length * 100);
		assert.closeTo(parseInt(b["c.b"], 10), calcBusy, 20);
	});
});
