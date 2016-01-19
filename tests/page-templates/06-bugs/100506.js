/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/100506", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have 3 beacons: 1 (manual beacon + 2 qt beacons), 1 manual beacon, 1 page load", function(done) {
		t.ensureBeaconCount(done, 3);
	});

	it("Should have qt on the first beacon containing the first and second requests", function() {
		var beacon = tf.beacons[0];
		assert.property(beacon, "qt");

		var qtValues = beacon.qt.split(",");
		assert.equal(2, qtValues.length);
	});

	it("Should have the first beacon with xhr.pg as image3 from the third request", function() {
		var beacon = tf.beacons[0];
		assert.equal("image3", beacon["xhr.pg"]);
	});

	it("Should have the first beacon with rt.start as manual beacon", function() {
		var beacon = tf.beacons[0];
		assert.equal("manual", beacon["rt.start"]);
	});

	it("Should have the first beacon with xhr.pg as image4 from the fourth request", function() {
		var beacon = tf.beacons[1];
		assert.equal("image4", beacon["xhr.pg"]);
	});

	it("Should have the second beacon with rt.start as manual beacon", function() {
		var beacon = tf.beacons[1];
		assert.equal("manual", beacon["rt.start"]);
	});

	it("Should have the third beacon as rt.start navigation from the 4th request (if NavigationTiming is supported)", function(){
		if (t.isNavigationTimingSupported()) {
			var beacon = tf.beacons[2];
			assert.equal("navigation", beacon["rt.start"]);
		}
	});

	it("Should have the third beacon as rt.start none from the 4th request (if NavigationTiming is not supported)", function(){
		if (!t.isNavigationTimingSupported()) {
			var beacon = tf.beacons[2];
			assert.equal("none", beacon["rt.start"]);
		}
	});
});
