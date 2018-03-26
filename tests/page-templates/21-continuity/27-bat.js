/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/27-bat", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have the battery timeline (c.t.bat) (if supported)", function() {
		var b = tf.lastBeacon();

		if (!b["c.t.bat"]) {
			return this.skip();
		}

		assert.isDefined(b["c.t.bat"]);

		var buckets = BOOMR.plugins.Continuity.decompressBucketLog(b["c.t.bat"]);

		// starts at 50
		var min = 50;
		for (var i = 0; i < buckets.length; i++) {
			if (buckets[i] === 0) {
				// not reported
				continue;
			}

			// assume always growing
			assert.operator(buckets[i], ">=", min);
			min = buckets[i];
		}
	});
});
