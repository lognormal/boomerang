/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["10-autoxhr-overlapping"] = function() {
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

	it("Should have sent two beacons (if AutoXHR is enabled)", function(done) {
		var _this = this;
		t.ifAutoXHR(
			done,
			function() {
				_this.timeout(10000);
				t.ensureBeaconCount(done, 2);
			},
			this.skip.bind(this));
	});

	//
	// Beacon 1 (page load)
	//
	describe("Beacon 1 (page load)", function() {
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
					assert.include(tf.beacons[0].u, "10-autoxhr-overlapping.html");
					done();
				},
				this.skip.bind(this));
		});
	});

	//
	// Beacon 2 (XHR)
	//
	describe("Beacon 2 (xhr)", function() {
		var i = 1;
		it("Should send the second beacon (XHR) with a t_done that includes both xhr requests", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.closeTo(tf.beacons[i].t_done, 5000, 200);
					done();
				},
				this.skip.bind(this));
		});

		it("Should send the second beacon (XHR) with widgets.json&id=1 as the 'u' parameter", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "widgets.json&id=1");
					done();
				},
				this.skip.bind(this));
		});
	});
};
