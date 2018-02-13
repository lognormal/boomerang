/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["16-autoxhr-after-load-with-mutation"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have only sent one beacon (if AutoXHR is not enabled)", function(done) {
		t.ifAutoXHR(
			done,
			this.skip.bind(this),
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
				assert.include(tf.beacons[0].u, "16-autoxhr-after-load-with-mutation.html");
				done();
			});
	});

	//
	// Beacon 2 (XHR)
	//
	it("Should send the second beacon (XHR) with the 3s it took to load the widgets.json XHR", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.closeTo(tf.beacons[1].t_done, 3000, 500);
				done();
			},
			this.skip.bind(this));
	});

	it("Should send the second beacon (XHR) with widgets.json as the 'u' parameter", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.include(tf.beacons[1].u, "widgets.json");
				done();
			},
			this.skip.bind(this));
	});

	//
	// Beacon 3 (XHR)
	//
	it("Should send the third beacon (XHR) with the 1s it took to load the widgets.json XHR", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.closeTo(tf.beacons[2].t_done, 1000, 250);
				done();
			},
			this.skip.bind(this));
	});

	it("Should send the third beacon (XHR) with widgets.json as the 'u' parameter", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.include(tf.beacons[2].u, "widgets.json");
				done();
			},
			this.skip.bind(this));
	});
};
