/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/22-page-busy-full", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have set the Page Busy (c.b)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.b"]);
	});

	it("Should have set the Page Busy percentage to over 90% (c.b)", function() {
		var b = tf.lastBeacon();

		assert.operator(parseInt(b["c.b"], 10), ">=", 90);
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
			if (buckets[i] === 0) {
				// not reported
				continue;
			}

			busyCount++;
		}

		// calculation is within 10% of c.b
		var calcBusy = Math.round(busyCount / buckets.length * 100);
		assert.closeTo(parseInt(b["c.b"], 10), calcBusy, 10);
	});
});
