/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/02-fps-after-load", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent two beacons", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 2);
	});

	it("Should have set the FPS (c.f) (if rAF is supported)", function() {
		if (!window.requestAnimationFrame) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isDefined(b["c.f"]);
		assert.operator(parseInt(b["c.f"], 10), ">", 0);
		assert.operator(parseInt(b["c.f"], 10), "<=", 60);
	});

	it("Should have set the FPS start time (c.f.s) (if rAF is supported)", function() {
		if (!window.requestAnimationFrame) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isDefined(b["c.f.s"]);
		assert.operator(parseInt(b["c.f.s"], 36), ">", 0);
		assert.operator(parseInt(b["c.f.s"], 36), ">=", performance.timing.navigationStart);
		assert.operator(parseInt(b["c.f.s"], 36), "<=", BOOMR.now());
	});

	it("Should have set the FPS start time (c.f.s) different from the first beacon (if rAF is supported)", function() {
		if (!window.requestAnimationFrame) {
			return this.skip();
		}

		assert.notEqual(tf.beacons[0]["c.f.s"], tf.beacons[1]["c.f.s"]);
	});

	it("Should have sent the FPS duration (c.f.d) (if rAF is supported)", function() {
		if (!window.requestAnimationFrame) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isDefined(b["c.f.d"]);
		assert.operator(parseInt(b["c.f.d"], 10), ">", 0);

		// close to t_done
		assert.closeTo(parseInt(b["c.f.d"], 10), b.t_done + 100, 100);
	});

	it("Should have sent the FPS long frames (c.f.l) (if rAF is supported)", function() {
		if (!window.requestAnimationFrame) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isDefined(b["c.f.l"]);
		assert.operator(parseInt(b["c.f.l"], 10), ">", 0);
	});

	it("Should have set the minimum FPS (c.f.m) (if rAF is supported)", function() {
		if (!window.requestAnimationFrame) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isDefined(b["c.f.m"]);
		assert.operator(parseInt(b["c.f.m"], 10), ">", 0);
	});

	it("Should have the FPS timeline (c.t.fps) (if rAF is supported)", function() {
		if (!window.requestAnimationFrame) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isDefined(b["c.t.fps"]);
		assert.operator(b["c.t.fps"].length, ">=", 1);
	});
});
