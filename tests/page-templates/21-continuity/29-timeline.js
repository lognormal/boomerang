/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/29-timeline", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent two beacons", function(done) {
		t.ensureBeaconCount(done, 2);
	});

	//
	// Beacon types
	//
	it("Should have the first beacon be a Page Load beacon", function() {
		var b = tf.beacons[0];
		assert.isUndefined(b["http.initiator"]);
	});

	it("Should have the second beacon be an Interaction beacon", function() {
		var b = tf.beacons[1];
		assert.equal(b["http.initiator"], "interaction");
	});

	//
	// Second beacon (first Interaction beacon) data
	//
	it("Should have the Continuity DOM Size Timeline (c.t.domsz) on the second beacon", function() {
		var b = tf.beacons[1];

		assert.isDefined(b["c.t.domsz"]);
		assert.operator(b["c.t.domsz"].length, ">=", 1);
	});

	it("Should have an ever-increasing Continuity DOM Size timeline (c.t.domsz) on the second beacon", function() {
		var b = tf.beacons[1];

		var buckets = BOOMR.plugins.Continuity.decompressBucketLog(b["c.t.domsz"]);

		// verify each grows
		var last = 0;
		for (var i = 0; i < buckets.length; i++) {
			assert.operator(buckets[i], ">=", last);
			last = buckets[i];
		}
	});
});
