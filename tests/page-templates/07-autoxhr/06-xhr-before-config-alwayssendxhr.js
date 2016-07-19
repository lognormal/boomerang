/*eslint-env mocha*/
/*global assert*/

describe("06-xhr-before-config-alwayssendxhr", function() {
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

	it("First beacon should be the navigation beacon", function() {
		var beacon = t.findNavBeacon();
		assert.isUndefined(beacon["http.initiator"]);
	});

	it("First beacon (navigation) should have rt.start = 'navigation' (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			var beacon = t.findNavBeacon();
			assert.equal(beacon["rt.start"], "navigation");
		}
	});

	it("First beacon (navigation) should have rt.start = 'none' (if NavigationTiming is not supported)", function() {
		if (!t.isNavigationTimingSupported()) {
			var beacon = t.findNavBeacon();
			assert.equal(beacon["rt.start"], "none");
		}
	});

	it("Second beacon should be an XHR, opened and completed before config", function() {
		var beacon = t.findXhrBeacon();
		assert.equal(beacon["http.initiator"], "xhr");
		assert.equal(beacon["rt.start"], "manual");
		assert.include(beacon.u, "boomerang-latest-debug.js&xhr1");
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
