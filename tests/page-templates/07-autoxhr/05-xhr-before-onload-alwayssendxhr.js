/*eslint-env mocha*/
/*global assert*/

describe("05-xhr-before-onload-alwayssendxhr", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 2 beacons: 1 onload, 1 xhr (XMLHttpRequest !== null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 2);
			});
	});

	it("Should have the first beacon be 'navigation' (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			assert.equal(tf.beacons[0]["rt.start"], "navigation");
		}
	});

	it("Should have the first beacon be 'none' (if NavigationTiming is not supported)", function() {
		if (!t.isNavigationTimingSupported()) {
			assert.equal(tf.beacons[0]["rt.start"], "none");
		}
	});

	it("Should have the first beacon have a restiming parameter (if ResourceTiming is supported)", function() {
		if (t.isResourceTimingSupported()) {
			assert.isDefined(tf.beacons[0].restiming);
		}
	});

	it("Should have the first beacon have a rt.bmr parameter (if ResourceTiming is supported)", function() {
		if (t.isResourceTimingSupported()) {
			assert.isDefined(tf.beacons[0]["rt.bmr"]);
		}
	});

	it("Should have the first beacon have a t_other parameter", function() {
		assert.isDefined(tf.beacons[0].t_other);

		assert.include(tf.beacons[0].t_other, "boomerang");
		if (t.isNavigationTimingSupported()) {
			//these timers are never started, when we check to add them to beacon,
			//because they don't have `start` on them, we check `cached_t_start` - which won't
			//have a value becaus there's no nav timing
			assert.include(tf.beacons[0].t_other, "boomr_fb");
			assert.include(tf.beacons[0].t_other, "boomr_ld");
			assert.include(tf.beacons[0].t_other, "boomr_lat");
		}
	});

	it("Should have the second beacon be an XHR", function() {
		assert.equal(tf.beacons[1]["http.initiator"], "xhr");
	});

	it("Should have the second beacon have a restiming parameter (if ResourceTiming is supported)", function() {
		if (t.isResourceTimingSupported()) {
			assert.isDefined(tf.beacons[1].restiming);
		}
	});

	it("Should have the second beacon be missing the rt.bmr parameter", function() {
		assert.isUndefined(tf.beacons[1]["rt.bmr"]);
	});

	it("Should have the second beacon be missing the t_other parameter", function() {
		assert.isUndefined(tf.beacons[1].t_other);
	});
});
