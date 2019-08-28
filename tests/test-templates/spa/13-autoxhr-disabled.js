/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["13-autoxhr-disabled"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have only sent one beacon (if AutoXHR is not enabled)", function(done) {
		var that = this;
		t.ifAutoXHR(
			done,
			this.skip.bind(this),
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
			},
			this.skip.bind(this));
	});

	//
	// Beacon 1 (page load)
	//
	it("Should send the first beacon (page load) with the time it took to load widgets.json (if NavigationTiming is supported)", function(done) {
		if (typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			t.ifAutoXHR(
				done,
				function() {
					t.validateBeaconWasSentAfter(0, "support/widgets.json", 500, 0, 30000);
					done();
				},
				this.skip.bind(this));
		}
		else {
			this.skip();
		}
	});

	it("Should send the first beacon (page load) without any load time (if NavigationTiming is not supported)", function(done) {
		if (typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[0];
					assert.equal(b.t_done, undefined);
					assert.equal(b["rt.start"], "none");
					done();
				},
				this.skip.bind(this));
		}
		else {
			this.skip();
		}
	});

	it("Should send the first beacon (page load) with the page URL as the 'u' parameter", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.include(tf.beacons[0].u, "13-autoxhr-disabled.html");
				done();
			},
			this.skip.bind(this));
	});
};
