/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/08-ember/09-autoxhr-before-page-load", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have only sent one beacon", function() {
		// only one beacon should've been sent
		assert.equal(tf.beacons.length, 1);
	});

	it("Should take as long as the longest img load (if MutationObserver and NavigationTiming are supported)", function() {
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			t.validateBeaconWasSentAfter(0, "img.jpg", 100, 3000, 30000, true);
		}
	});

	it("Should not have a load time (if MutationObserver is supported but NavigationTiming is not)", function() {
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
			var b = tf.lastBeacon();
			assert.equal(b.t_done, undefined);
		}
	});

	it("Should take as long as the XHRs (if MutationObserver is not supported but NavigationTiming is)", function() {
		if (typeof window.MutationObserver === "undefined" && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			t.validateBeaconWasSentAfter(0, "widget.json", 100, 0, 30000, true);
		}
	});

	it("Shouldn't have a load time (if MutationObserver and NavigationTiming are not supported)", function() {
		if (typeof window.MutationObserver === "undefined" && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
			var b = tf.lastBeacon();
			assert.equal(b.t_done, undefined);
			assert.equal(b["rt.start"], "manual");
		}
	});

	it("Should have sent the http.initiator as 'spa'", function() {
		var b = tf.lastBeacon();
		assert.equal(b["http.initiator"], "spa");
	});
});
