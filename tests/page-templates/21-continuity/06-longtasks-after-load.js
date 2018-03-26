/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/06-longtasks-after-load", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent 2 beacons", function(done) {
		t.ensureBeaconCount(done, 2);
	});

	it("Should have set the LongTask count (c.lt.n) (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isDefined(b["c.lt.n"]);
		assert.operator(parseInt(b["c.lt.n"], 10), ">=", 1);
	});

	it("Should have set the LongTask time (c.lt.tt) (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isDefined(b["c.lt.tt"]);
		assert.operator(parseInt(b["c.lt.tt"], 10), ">", 1500);
		assert.operator(parseInt(b["c.lt.tt"], 10), "<=", 3000);
	});

	it("Should have set the LongTask data (c.lt) start time for the first task (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		var ltData = BOOMR.utils.Compression.jsUrlDecompress(b["c.lt"])[0];
		assert.operator(parseInt(ltData.s, 36), ">=",
			performance.timing.loadEventStart - performance.timing.navigationStart);
	});

	it("Should have set the LongTask data (c.lt) duration for the first task (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		var ltData = BOOMR.utils.Compression.jsUrlDecompress(b["c.lt"])[0];
		assert.operator(parseInt(ltData.d, 36), ">=", 1500);
		assert.operator(parseInt(ltData.d, 36), "<=", 3000);
	});

	it("Should have set the LongTask data (c.lt) type for the first task (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		var ltData = BOOMR.utils.Compression.jsUrlDecompress(b["c.lt"])[0];
		assert.equal(ltData.n, "1");
	});

	it("Should have the LongTask timeline (c.t.longtask) (if LongTasks are supported)", function() {
		if (!t.isLongTasksSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.fps"]);
		assert.operator(b["c.t.fps"].length, ">=", 1);
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
});
