/*eslint-env mocha*/

describe("e2e/07-autoxhr/01-img-src-change", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should get 2 beacons: 1 onload, 1 spa (AutoXHR is supported)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 2);
			},
			this.skip.bind(this));
	});

	it("Should get 1 beacon: 1 onload (AutoXHR is not supported)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			this.skip.bind(this),
			function() {
				t.ensureBeaconCount(done, 1);
			},
			this.skip.bind(this));
	});

	describe("Beacon 1", function() {
	});

	describe("Beacon 2", function() {
		var i = 1;
		it("Should have spa beacon type", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[i];
					assert.equal(b["http.initiator"], "spa");
					done();
				},
				this.skip.bind(this));
		});

		it("Should have t_done time include image load times (if MutationObserver is supported)", function(done) {
			if (t.isMutationObserverSupported()) {
				t.ifAutoXHR(
					done,
					function() {
						var b = tf.beacons[i];
						// ~ 500 img + 2000 img + 300 of setTimeout delays
						assert.closeTo(b.t_done, 2800, 200);
						done();
					},
				this.skip.bind(this));
			}
			else {
				this.skip();
			}
		});

		it("Should not have t_done time include image load times (if MutationObserver is not supported)", function(done) {
			if (!t.isMutationObserverSupported()) {
				t.ifAutoXHR(
					done,
					function() {
						var b = tf.beacons[i];
						assert.closeTo(b.t_done, 0, 200);
						done();
					},
					this.skip.bind(this));
			}
			else {
				this.skip();
			}
		});
	});
});
