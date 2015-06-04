/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/08-ember/05-autoxhr-overlapping", function() {
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

	it("Should have sent three beacons (if AutoXHR is enabled)", function(done) {
		var _this = this;
		t.ifAutoXHR(
			done,
			function() {
				_this.timeout(10000);
				t.ensureBeaconCount(done, 3);
			});
	});

	//
	// Beacon 1 (page load)
	//
	it("Should send the first beacon (page load) with the time it took to load metric.html (if NavigationTiming is supported)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				if (typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
					t.validateBeaconWasSentAfter(0, "support/metric.html", 500, 1500, 30000);
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
				assert.include(tf.beacons[0].u, "05-autoxhr-overlapping.html");
				done();
			});
	});

	//
	// Beacon 2 (XHRs)
	//
	it("Should send the second beacon (XHR) with the 2 seconds it took to load widget.json", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.closeTo(tf.beacons[1].t_done, 2000, 500);
				done();
			});
	});

	it("Should send the second beacon (XHR) with widgets.json as the 'u' parameter", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.include(tf.beacons[1].u, "widget.json&id=1");
				done();
			});
	});

	//
	// Beacon 3 (XHRs)
	//
	it("Should send the third beacon (XHR) with the 4.5 seconds it took to load widget.json", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.closeTo(tf.beacons[2].t_done, 4500, 500);
				done();
			});
	});

	it("Should send the third beacon (XHR) with widgets.json as the 'u' parameter", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.include(tf.beacons[2].u, "widget.json&id=2");
				done();
			});
	});
});
