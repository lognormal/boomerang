/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/26-mem", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have the memory timeline (c.t.mem) (if supported)", function() {
		var b = tf.lastBeacon();

		if (!b["c.t.mem"]) {
			return this.skip();
		}

		assert.isDefined(b["c.t.mem"]);

		var buckets = BOOMR.plugins.Continuity.decompressBucketLog(b["c.t.mem"]);

		var min = 100000;
		for (var i = 0; i < buckets.length; i++) {
			if (buckets[i] === 0) {
				// not reported
				continue;
			}

			// assume memory will only grow during this test
			assert.isTrue(buckets[i] >= min);
			min = buckets[i];
		}
	});
});
