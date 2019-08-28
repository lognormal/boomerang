/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/100506", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have 5 beacons: 1 page load, 5 manual beacons", function(done) {
		t.ensureBeaconCount(done, 5);
	});

	it("Should have the first beacon as rt.start navigation (if NavigationTiming is supported)", function(){
		if (t.isNavigationTimingSupported()) {
			var beacon = tf.beacons[0];
			assert.equal("navigation", beacon["rt.start"]);
		}
	});

	it("Should have the first beacon as rt.start none (if NavigationTiming is not supported)", function(){
		if (!t.isNavigationTimingSupported()) {
			var beacon = tf.beacons[0];
			assert.equal("none", beacon["rt.start"]);
		}
	});

	it("Should have all of the rest of the beacons having the image* page group", function() {
		for (var i = 1; i < 4; i++) {
			var beacon = tf.beacons[i];
			assert.include(beacon["xhr.pg"], "image");
		}
	});

	it("Should have all of the rest of the beacons having rt.start = manual", function() {
		for (var i = 1; i < 4; i++) {
			var beacon = tf.beacons[i];
			assert.equal("manual", beacon["rt.start"]);
		}
	});
});
