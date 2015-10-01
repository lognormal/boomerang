/*eslint-env mocha*/
/*global assert*/

describe("05-xhr-before-onload-alwayssendxhr", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 4 beacons: 1 onload, 3 xhr (XMLHttpRequest !== null)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.lengthOf(tf.beacons, 4);
				done();
			});
	});

	it("First beacon should be an XHR, opened and completed before config", function() {
		var beacon = tf.beacons[0];
		assert.equal(beacon["http.initiator"], "xhr");
		assert.equal(beacon["rt.start"], "manual");
		assert.include(beacon.u, "boomerang-latest-debug.js&xhr1");
	});

	it("Second beacon should be the navigation beacon", function() {
		var beacon = tf.beacons[1];
		assert.isUndefined(beacon["http.initiator"]);
	});

	it("Second beacon (navigation) should have rt.start = 'navigation' (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			var beacon = tf.beacons[1];
			assert.equal(beacon["rt.start"], "navigation");
		}
	});

	it("Second beacon (navigation) should have rt.start = 'none' (if NavigationTiming is not supported)", function() {
		if (!t.isNavigationTimingSupported()) {
			var beacon = tf.beacons[1];
			assert.equal(beacon["rt.start"], "none");
		}
	});

	it("Third beacon should be an XHR, opened before config, completed after config", function() {
		var beacon = tf.beacons[2];
		assert.equal(beacon["http.initiator"], "xhr");
		assert.equal(beacon["rt.start"], "manual");
		assert.include(beacon.u, "boomerang-latest-debug.js&xhr2");
	});

	it("Fourth beacon should be an XHR, opened and completed after config", function() {
		var beacon = tf.beacons[3];
		assert.equal(beacon["http.initiator"], "xhr");
		assert.equal(beacon["rt.start"], "manual");
		assert.include(beacon.u, "boomerang-latest-debug.js&xhr3");
	});

});
