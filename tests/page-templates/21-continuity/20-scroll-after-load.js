/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/20-scroll-after-load", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent two beacons", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 2);
	});

	it("Should have not sent the scroll count (c.s) on the first beacon", function() {
		var b = tf.beacons[0];

		assert.isUndefined(b["c.s"]);
	});

	it("Should have not sent the scroll Y (pixels) (c.s.y) on the first beacon", function() {
		var b = tf.beacons[0];

		assert.isUndefined(b["c.s.y"]);
	});

	it("Should have not sent the scroll percentage (c.s.p) on the first beacon", function() {
		var b = tf.beacons[0];

		assert.isUndefined(b["c.s.p"]);
	});

	it("Should have not sent the distinct scrolls (c.s.d) on the first beacon", function() {
		var b = tf.beacons[0];

		assert.isUndefined(b["c.s.d"]);
	});

	it("Should have sent the scroll count (c.s) on the second beacon", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.s"]);
		assert.equal(parseInt(b["c.s"], 10), 4);
	});

	it("Should have sent the scroll Y (pixels) (c.s.y) on the second beacon", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.s.y"]);
		assert.operator(parseInt(b["c.s.y"], 10), ">", 0);
		assert.operator(parseInt(b["c.s.y"], 10), "<=", 40000);
		assert.closeTo(parseInt(b["c.s.y"], 10), 36000, 4000);
	});

	it("Should have sent the scroll percentage (c.s.p) on the second beacon", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.s.p"]);
		assert.closeTo(parseInt(b["c.s.p"], 10), 400, 5);
	});

	it("Should have sent the distinct scrolls (c.s.d) on the second beacon", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.s.d"]);
		assert.equal(parseInt(b["c.s.d"], 10), 2);
	});

	it("Should have sent the log (c.l) on the second beacon", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.l"]);
	});

	it("Should have logged the correct events (c.l) on the second beacon", function() {
		var b = tf.lastBeacon();

		var scrollLogs = BOOMR.plugins.Continuity.decompressLog(b["c.l"]).filter(function(obj) {
			// LOG_TYPE_SCROLL === 0
			return obj.type === 0;
		});

		assert.equal(scrollLogs.length, 4);

		assert.operator(parseInt(scrollLogs[0].y, 36), ">=", 100);
		assert.equal(parseInt(scrollLogs[1].y, 36), 0);
		assert.operator(parseInt(scrollLogs[2].y, 36), ">=", 100);
		assert.equal(parseInt(scrollLogs[3].y, 36), 0);
	});

	it("Should have the scroll timeline (c.t.scroll) on the second beacon", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.scroll"]);
		assert.operator(b["c.t.scroll"].length, ">=", 1);
	});

	it("Should have the scroll percent timeline (c.t.scrollpct) on the second beacon", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.scrollpct"]);
		assert.operator(b["c.t.scrollpct"].length, ">=", 1);
	});

	it("Should have the interaction timeline (c.t.inter) on the second beacon", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.inter"]);
		assert.operator(b["c.t.inter"].length, ">=", 1);
	});

	it("Should have the Time to First Interaction (c.ttfi) on the second beacon", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.ttfi"]);
		assert.operator(parseInt(b["c.ttfi"], 10), ">=", 1);
	});

	it("Should the same Continuity Epoch on the second beacon", function() {
		var b1 = tf.beacons[0];
		var b2 = tf.beacons[1];

		assert.equal(b1["c.e"], b2["c.e"]);
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

	it("Should not have First Input Delay (c.fid) on the first beacon", function() {
		var b = tf.beacons[0];

		assert.isUndefined(b["c.fid"]);
	});

	it("Should have First Input Delay (c.fid) on the second beacon", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.fid"]);
		assert.operator(parseInt(b["c.fid"], 10), ">=", 0);
	});
});
