/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/11-mouse", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent the mouse percent (c.m.p)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.m.p"]);
		assert.operator(parseInt(b["c.m.p"], 10), ">=", 200);
	});

	it("Should have sent the mouse pixels (c.m.n)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.m.n"]);
		assert.operator(parseInt(b["c.m.n"], 10), ">=", 100);
	});

	it("Should have sent the log (c.l)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.l"]);
	});

	it("Should have logged the correct events (c.l)", function() {
		var b = tf.lastBeacon();

		var mouseLogs = BOOMR.plugins.Continuity.decompressLog(b["c.l"]).filter(function(obj) {
			// LOG_TYPE_MOUSE === 2
			return obj.type === 2;
		});

		assert.operator(mouseLogs.length, ">=", 1);

		for (var i = 0; i < mouseLogs.length; i++) {
			// should all be x,y === 100 or 200
			var x = parseInt(mouseLogs[i].x, 36);
			var y = parseInt(mouseLogs[i].y, 36);
			assert.operator(x, ">=", 100);
			assert.operator(y, ">=", 100);
		}
	});

	it("Should have the mouse timeline (c.t.mouse)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.mouse"]);
		assert.operator(b["c.t.mouse"].length, ">=", 1);
	});

	it("Should have the mouse percent timeline (c.t.mousepct)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.mousepct"]);
		assert.operator(b["c.t.mousepct"].length, ">=", 1);
	});
});
