/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/13-logn-config/03-autorun-false-delay", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var assert = chai.assert;

	it("Should have sent a beacon", function(done) {
		t.ensureBeaconCount(done, 1);
	});

	it("Should have a load time under 3 seconds (if NavigationTiming is supported)", function() {
		var b = tf.lastBeacon();

		if (!b.t_done) {
			// non-NavTiming browsers won't know how to calculate Page Load time
			return this.skip();
		}

		assert.operator(b.t_done, "<=", 3000);
	});

	it("Should not have NavigationTiming Load timestamps (if NavigationTiming is supported)", function() {
		if (!t.isNavigationTimingSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		assert.isUndefined(b.nt_load_st);
		assert.isUndefined(b.nt_load_end);
	});
});
