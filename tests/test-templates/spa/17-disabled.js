/*eslint-env mocha*/
/*global BOOMR_test,assert*/

BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["17-disabled"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent one beacon for navigation", function(done){
		// wait long enough that a possible second beacon may occur
		this.timeout(4000);
		setTimeout(function() {
			t.ensureBeaconCount(done, 1);
		}, 2000);
	});

	it("Should have only one beacon with type = navigation (if NavigationTiming is supported)", function(){
		var b = tf.beacons[0];

		if (t.isNavigationTimingSupported()) {
			assert.equal(b["rt.start"], "navigation");
		}
	});

	it("Should have only one beacon with type = none (if NavigationTiming is NOT supported)", function(){
		var b = tf.beacons[0];

		if (!t.isNavigationTimingSupported()) {
			assert.equal(b["rt.start"], "none");
		}
	});

	it("Should have the current page as URL", function(){
		assert.include(tf.beacons[0].u, "17-disabled.html");
	});

};
