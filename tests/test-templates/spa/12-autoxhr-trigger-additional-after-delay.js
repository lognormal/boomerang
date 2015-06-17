/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["12-autoxhr-trigger-additional-after-delay"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have only sent one beacon (if AutoXHR is not enabled)", function(done) {
		t.ifAutoXHR(
			done,
			undefined,
			function() {
				t.ensureBeaconCount(done, 1);
			});
	});

	it("Should have sent two beacons (if AutoXHR is enabled)", function(done) {
		var _this = this;
		t.ifAutoXHR(
			done,
			function() {
				_this.timeout(10000);
				t.ensureBeaconCount(done, 2);
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
					t.validateBeaconWasSentAfter(0, "support/widgets.json", 500, 0, 30000);
				}
				done();
			});
	});

	it("Should send the first beacon (page load) without any load time (if NavigationTiming is not supported)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				if (typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
					var b = tf.beacons[0];
					assert.equal(b.t_done, undefined);
					assert.equal(b["rt.start"], "none");
				}
				done();
			});
	});

	it("Should send the first beacon (page load) with the page URL as the 'u' parameter", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.include(tf.beacons[0].u, "12-autoxhr-trigger-additional-after-delay.html");
				done();
			});
	});

	//
	// Beacon 2 (XHRs)
	//
	it("Should send the second beacon (XHR) with the 4 seconds it took to load both widgets.json and the image (if MutationObserver is supported)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				if (window.MutationObserver) {
					assert.closeTo(tf.beacons[1].t_done, 4000, 500);
				}
				done();
			});
	});

	it("Should send the second beacon (XHR) with the 2 seconds it took to load widgets.json (if MutationObserver is not supported)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				if (typeof window.MutationObserver === "undefined") {
					assert.closeTo(tf.beacons[1].t_done, 2000, 500);
				}
				done();
			});
	});

	it("Should send the second beacon (XHR) with widgets.json as the 'u' parameter", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.include(tf.beacons[1].u, "widgets.json&id=1");
				done();
			});
	});
};
