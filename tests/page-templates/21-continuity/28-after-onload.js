/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/28-after-onload", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent three beacons", function(done) {
		t.ensureBeaconCount(done, 3);
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

	it("Should have the third beacon be an Interaction beacon", function() {
		var b = tf.beacons[2];
		assert.equal(b["http.initiator"], "interaction");
	});

	//
	// Second beacon (first Interaction beacon) data
	//
	it("Should have the Continuity Key Count of (c.k) of 2 on the second beacon", function() {
		var b = tf.beacons[1];
		assert.equal(b["c.k"], 2);
	});

	it("Should have the Continuity Epoch (c.e) as the start of the Page Load beacon on the second beacon (if NavigationTiming is supported)", function() {
		if (!t.isNavigationTimingSupported()) {
			return this.skip();
		}

		var b1 = tf.beacons[0];
		var b2 = tf.beacons[1];

		var firstBeaconEnd = parseInt(b1["rt.tstart"], 10);
		var secondBeaconEpoch = parseInt(b2["c.e"], 36);

		assert.equal(secondBeaconEpoch, firstBeaconEnd);
	});

	it("Should have the Continuity Last Beacon (c.e) after the end of the Page Load beacon on the second beacon", function() {
		var b1 = tf.beacons[0];
		var b2 = tf.beacons[1];

		var firstBeaconEnd = parseInt(b1["rt.end"], 10);
		var secondBeaconLastBeacon = parseInt(b2["c.lb"], 36);

		assert.operator(secondBeaconLastBeacon, ">=", firstBeaconEnd);
	});

	it("Should have the Continuity Log (c.l) on the second beacon", function() {
		var b = tf.beacons[1];

		assert.isDefined(b["c.l"]);
	});

	it("Should have the correct Continuity Log events (c.l) on the second beacon", function() {
		var b = tf.beacons[1];

		var keyLogs = BOOMR.plugins.Continuity.decompressLog(b["c.l"]).filter(function(obj) {
			// LOG_TYPE_KEY === 3
			return obj.type === 3;
		});

		assert.equal(keyLogs.length, 2);
	});

	it("Should have the Continuity Key Timeline (c.t.key) on the second beacon", function() {
		var b = tf.beacons[1];

		assert.isDefined(b["c.t.key"]);
		assert.operator(b["c.t.key"].length, ">=", 1);
	});

	it("Should have the Continuity interaction timeline (c.t.inter) on the second beacon", function() {
		var b = tf.beacons[1];

		assert.isDefined(b["c.t.inter"]);
		assert.operator(b["c.t.inter"].length, ">=", 1);
	});

	it("Should have the Continuity Time to First Interaction (c.ttfi) on the second beacon", function() {
		var b = tf.beacons[1];

		assert.isDefined(b["c.ttfi"]);
		assert.operator(parseInt(b["c.ttfi"], 10), ">=", 1);
	});

	it("Should have the Continuity Start (rt.tstart) on the second beacon (if NavigationTiming is supported)", function() {
		if (!t.isNavigationTimingSupported()) {
			return this.skip();
		}

		var b1 = tf.beacons[0];
		var b2 = tf.beacons[1];

		var firstBeaconEnd = parseInt(b1["rt.end"], 10);
		var secondBeaconStart = parseInt(b2["rt.tstart"], 10);

		assert.operator(secondBeaconStart, ">=", firstBeaconEnd);
	});

	it("Should have the Continuity End (rt.end) on the second beacon", function() {
		var b1 = tf.beacons[0];
		var b2 = tf.beacons[1];

		var firstBeaconEnd = parseInt(b1["rt.end"], 10);
		var secondBeaconStart = parseInt(b2["rt.tstart"], 10);
		var secondBeaconEnd = parseInt(b2["rt.end"], 10);

		assert.operator(secondBeaconEnd, ">=", firstBeaconEnd);
		assert.operator(secondBeaconEnd, ">=", secondBeaconStart);
	});

	//
	// Third beacon (second Interaction beacon) data
	//
	it("Should have the Continuity Key Count of (c.k) of 1 on the third beacon", function() {
		var b = tf.beacons[2];
		assert.equal(b["c.k"], 1);
	});

	it("Should have the Continuity Epoch (c.e) as the start of the Page Load beacon on the third beacon (if NavigationTiming is supported)", function() {
		if (!t.isNavigationTimingSupported()) {
			return this.skip();
		}

		var b1 = tf.beacons[0];
		var b3 = tf.beacons[2];

		var firstBeaconEnd = parseInt(b1["rt.tstart"], 10);
		var thirdBeaconEpoch = parseInt(b3["c.e"], 36);

		assert.equal(thirdBeaconEpoch, firstBeaconEnd);
	});

	it("Should have the Continuity Frame Duration (c.f.d) on the third beacon larger than the second beacon", function() {
		var b2 = tf.beacons[1];
		var b3 = tf.beacons[2];

		if (!b2["c.f.d"] || !b3["c.f.d"]) {
			return this.skip();
		}

		var second = parseInt(b2["c.f.d"], 10);
		var third = parseInt(b3["c.f.d"], 10);

		assert.operator(third, ">", second);
	});

	it("Should have the Continuity Frame Start (c.f.s) on the third beacon larger than the second beacon", function() {
		var b2 = tf.beacons[1];
		var b3 = tf.beacons[2];

		if (!b2["c.f.s"] || !b3["c.f.s"]) {
			return this.skip();
		}

		var second = parseInt(b2["c.f.s"], 36);
		var third = parseInt(b3["c.f.s"], 36);

		assert.operator(third, ">", second);
	});

	it("Should have the Continuity Last Beacon (c.e) after the end of the second beacon on the third beacon", function() {
		var b1 = tf.beacons[0];
		var b3 = tf.beacons[2];

		var secondBeaconEnd = parseInt(b1["rt.end"], 10);
		var thirdBeaconLastBeacon = parseInt(b3["c.lb"], 36);

		assert.operator(thirdBeaconLastBeacon, ">=", secondBeaconEnd);
	});

	it("Should have the Continuity Log (c.l) on the third beacon", function() {
		var b = tf.beacons[2];

		assert.isDefined(b["c.l"]);
	});

	it("Should have the correct Continuity Log events (c.l) on the third beacon", function() {
		var b = tf.beacons[2];

		var keyLogs = BOOMR.plugins.Continuity.decompressLog(b["c.l"]).filter(function(obj) {
			// LOG_TYPE_KEY === 3
			return obj.type === 3;
		});

		assert.equal(keyLogs.length, 1);
	});

	it("Should have the Continuity Key Timeline (c.t.key) on the third beacon", function() {
		var b = tf.beacons[2];

		assert.isDefined(b["c.t.key"]);
		assert.operator(b["c.t.key"].length, ">=", 1);
	});

	it("Should have the Continuity interaction timeline (c.t.inter) on the third beacon", function() {
		var b = tf.beacons[2];

		assert.isDefined(b["c.t.inter"]);
		assert.operator(b["c.t.inter"].length, ">=", 1);
	});

	it("Should have the Continuity Time to First Interaction (c.ttfi) on the third beacon same as the second beacon", function() {
		var b2 = tf.beacons[1];
		var b3 = tf.beacons[2];

		var second = parseInt(b2["c.ttfi"], 10);
		var third = parseInt(b3["c.ttfi"], 10);

		assert.isDefined(b3["c.ttfi"]);
		assert.equal(second, third);
	});

	it("Should have the Continuity Start (rt.tstart) on the third beacon", function() {
		var b2 = tf.beacons[1];
		var b3 = tf.beacons[2];

		var secondBeaconEnd = parseInt(b2["rt.end"], 10);
		var thirdBeaconStart = parseInt(b3["rt.tstart"], 10);

		assert.operator(thirdBeaconStart, ">=", secondBeaconEnd);
	});

	it("Should have the Continuity End (rt.end) on the third beacon", function() {
		var b2 = tf.beacons[1];
		var b3 = tf.beacons[2];

		var secondBeaconEnd = parseInt(b2["rt.end"], 10);
		var thirdBeaconStart = parseInt(b3["rt.tstart"], 10);
		var thirdBeaconEnd = parseInt(b3["rt.end"], 10);

		assert.operator(thirdBeaconEnd, ">=", secondBeaconEnd);
		assert.operator(thirdBeaconEnd, ">=", thirdBeaconStart);
	});
});
