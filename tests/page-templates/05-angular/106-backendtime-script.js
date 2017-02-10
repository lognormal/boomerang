/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/05-angular/106-backendtime-script", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent two beacons", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done,  2);
	});

	it("Should have a t_resp <= t_done on second beacon (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			var b = tf.beacons[1];
			assert.operator(parseInt(b.t_resp, 10), "<=", parseInt(b.t_done, 10));
		}
	});

	it("Should have a t_resp > 0 on second beacon (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			var b = tf.beacons[1];
			assert.operator(parseInt(b.t_resp, 10), ">", 0);
		}
	});
});
