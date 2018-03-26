/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/19-scroll", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent the scroll count (c.s)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.s"]);
		assert.equal(parseInt(b["c.s"], 10), 2);
	});

	it("Should have sent the scroll Y (pixels) (c.s.y)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.s.y"]);
		assert.operator(parseInt(b["c.s.y"], 10), ">", 0);
		assert.operator(parseInt(b["c.s.y"], 10), "<=", 20000);
		assert.closeTo(parseInt(b["c.s.y"], 10), 18000, 2000);
	});

	it("Should have sent the scroll percentage (c.s.p)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.s.p"]);
		assert.closeTo(parseInt(b["c.s.p"], 10), 200, 5);
	});

	it("Should have sent the distinct scrolls (c.s.d)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.s.d"]);
		assert.equal(parseInt(b["c.s.d"], 10), 1);
	});

	it("Should have sent the log (c.l)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.l"]);
	});

	it("Should have logged the correct events (c.l)", function() {
		var b = tf.lastBeacon();

		var scrollLogs = BOOMR.plugins.Continuity.decompressLog(b["c.l"]).filter(function(obj) {
			// LOG_TYPE_SCROLL === 0
			return obj.type === 0;
		});

		assert.equal(scrollLogs.length, 2);

		assert.operator(parseInt(scrollLogs[0].y, 36), ">=", 100);
		assert.equal(parseInt(scrollLogs[1].y, 36), 0);
	});

	it("Should have the scroll timeline (c.t.scroll)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.scroll"]);
		assert.operator(b["c.t.scroll"].length, ">=", 1);
	});

	it("Should have the scroll percent timeline (c.t.scrollpct)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.scrollpct"]);
		assert.operator(b["c.t.scrollpct"].length, ">=", 1);
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

	it("Should have First Input Delay (c.fid)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.fid"]);
		assert.operator(parseInt(b["c.fid"], 10), ">=", 0);
	});
});
