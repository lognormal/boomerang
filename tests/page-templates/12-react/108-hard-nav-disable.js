/*eslint-env mocha*/
/*global BOOMR_test,describe,it,assert*/

describe("e2e/12-react/108-hard-nav-disable", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	var pathName = window.location.pathname;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent three beacons", function() {
		assert.equal(tf.beacons.length, 3);
	});

	it("Should have first beacon be navigation beacon", function() {
		var b = tf.beacons[0];
		if (t.isNavigationTimingSupported()) {
			assert.equal(b["rt.start"], "navigation");
		}
		else {
			assert.equal(b["rt.start"], "none");
		}
		assert.isUndefined(b["http.initiator"]);
	});

	it("Should have a t_done close to 'timestamp - navigationStart'", function() {
		var b = tf.beacons[0];
		if (t.isNavigationTimingSupported()) {
			var navStToBoomrTDoneDelta = window.boomr_t_done - window.performance.timing.navigationStart;
			assert.closeTo(navStToBoomrTDoneDelta, b.t_done, 100);
		}
	});

	it("Second beacon should be soft navigation beacon", function() {
		var b = tf.beacons[1];
		assert.equal(b["http.initiator"], "spa");
	});

	it("Third beacon should be soft navigation beacon", function() {
		var b = tf.beacons[2];
		assert.equal(b["http.initiator"], "spa");
	});
});
