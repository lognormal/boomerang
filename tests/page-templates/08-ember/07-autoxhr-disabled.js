/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/08-ember/07-autoxhr-disabled", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have only sent one beacon (if AutoXHR is not enabled)", function(done) {
		var that = this;
		t.ifAutoXHR(
			done,
			undefined,
			function() {
				// wait 3 seconds to make sure another beacon wasn't sent
				that.timeout(10000);
				setTimeout(function() {
					t.ensureBeaconCount(done, 1);
				}, 3000);
			});
	});

	it("Should have only sent one beacon (if AutoXHR is enabled)", function(done) {
		var that = this;
		t.ifAutoXHR(
			done,
			function() {
				// wait 3 seconds to make sure another beacon wasn't sent
				that.timeout(10000);
				setTimeout(function() {
					t.ensureBeaconCount(done, 1);
				}, 3000);
			});
	});

	//
	// Beacon 1 (page load)
	//
	it("Should send the first beacon (page load) with the time it took to load widgets.json (if NavigationTiming is supported)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				if (typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
					t.validateBeaconWasSentAfter(0, "support/widget.json", 500, 0, 30000);
				}
				done();
			});
	});

	it("Should send the first beacon (page load) without any load time (if NavigationTiming is supported)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				if (typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
					var b = tf.beacons[0];
					assert.equal(b.t_done, undefined);
					assert.equal(b["rt.start"], "manual");
				}
				done();
			});
	});

	it("Should send the first beacon (page load) with the page URL as the 'u' parameter", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.include(tf.beacons[0].u, "07-autoxhr-disabled.html");
				done();
			});
	});
});
