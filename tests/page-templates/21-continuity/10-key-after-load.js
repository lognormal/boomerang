/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/10-key-after-load", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent the key count (c.k)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.k"]);
		assert.equal(parseInt(b["c.k"], 10), 5);
	});

	it("Should have sent the esc key count (c.k.e)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.k.e"]);
		assert.equal(parseInt(b["c.k.e"], 10), 5);
	});

	it("Should have sent the log (c.l)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.l"]);
	});

	it("Should have logged the correct events (c.l)", function() {
		var b = tf.lastBeacon();

		var keyLogs = BOOMR.plugins.Continuity.decompressLog(b["c.l"]).filter(function(obj) {
			// LOG_TYPE_KEY === 3
			return obj.type === 3;
		});

		assert.equal(keyLogs.length, 5);
	});

	it("Should have the key timeline (c.t.key)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.key"]);
		assert.operator(b["c.t.key"].length, ">=", 1);
	});

	it("Should have the interaction timeline (c.t.inter)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.inter"]);
		assert.operator(b["c.t.inter"].length, ">=", 1);
	});

	it("Should have the Time to First Interaction (c.ttfi)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.ttfi"]);
		assert.operator(parseInt(b["c.ttfi"], 10), ">=", 1);
	});

	it("Should have last Continuity beacon time (c.lb) on the second beacon but not on the first", function() {
		var b1 = tf.beacons[0];
		var b2 = tf.beacons[1];

		// first beacon
		assert.isUndefined(b1["c.lb"]);

		// second beacon
		assert.isDefined(b2["c.lb"]);
		assert.closeTo(parseInt(b2["c.lb"], 36), BOOMR.now(), 10000);
	});

	it("Should have First Input Delay (c.fid) on the first beacon", function() {
		var b = tf.beacons[0];

		assert.isDefined(b["c.fid"]);
		assert.operator(parseInt(b["c.fid"], 10), ">=", 0);
	});

	it("Should have First Input Delay (c.fid) on the second beacon", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.fid"]);
		assert.operator(parseInt(b["c.fid"], 10), ">=", 0);
	});
});
