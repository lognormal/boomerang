/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/21-dom", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have the DOM size timeline (c.t.domsz)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.domsz"]);
		assert.operator(b["c.t.domsz"].length, ">=", 1);

		var buckets = BOOMR.plugins.Continuity.decompressBucketLog(b["c.t.domsz"]);

		// verify each grows
		var last = 0;
		for (var i = 0; i < buckets.length; i++) {
			if (buckets[i] === 0) {
				// not reported
				continue;
			}

			assert.operator(buckets[i], ">=", last);
			last = buckets[i];
		}
	});

	it("Should have the DOM length timeline (c.t.domln)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.domln"]);
		assert.operator(b["c.t.domln"].length, ">=", 1);

		var buckets = BOOMR.plugins.Continuity.decompressBucketLog(b["c.t.domln"]);

		// verify each grows
		var last = 0;
		for (var i = 0; i < buckets.length; i++) {
			if (buckets[i] === 0) {
				// not reported
				continue;
			}

			assert.operator(buckets[i], ">=", last);
			last = buckets[i];
		}
	});

	it("Should have the DOM mutation timeline (c.t.mut) (if MutationObserver is supported)", function() {
		if (!t.isMutationObserverSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.mut"]);
		assert.operator(b["c.t.mut"].length, ">=", 1);

		var buckets = BOOMR.plugins.Continuity.decompressBucketLog(b["c.t.mut"]);

		// verify each is 0 or less than 100
		for (var i = 0; i < buckets.length; i++) {
			assert.operator(buckets[i], ">=", 0);
			assert.operator(buckets[i], "<=", 100);
		}
	});
});
