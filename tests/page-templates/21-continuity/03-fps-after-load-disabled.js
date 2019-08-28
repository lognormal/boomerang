/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/03-fps-after-load-disabled", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent two beacons", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 2);
	});

	it("Should not have  set the FPS (c.f) (if rAF is supported)", function() {
		if (!window.requestAnimationFrame) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isUndefined(b["c.f"]);
	});

	it("Should not have set the FPS start time (c.f.s) (if rAF is supported)", function() {
		if (!window.requestAnimationFrame) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isUndefined(b["c.f.s"]);
	});

	it("Should not have sent the FPS duration (c.f.d) (if rAF is supported)", function() {
		if (!window.requestAnimationFrame) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isUndefined(b["c.f.d"]);
	});

	it("Should not have sent the FPS long frames (c.f.l) (if rAF is supported)", function() {
		if (!window.requestAnimationFrame) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isUndefined(b["c.f.l"]);
	});

	it("Should not have set the minimum FPS (c.f.m) (if rAF is supported)", function() {
		if (!window.requestAnimationFrame) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isUndefined(b["c.f.m"]);
	});

	it("Should not have the FPS timeline (c.t.fps) (if rAF is supported)", function() {
		if (!window.requestAnimationFrame) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isUndefined(b["c.t.fps"]);
	});
});
