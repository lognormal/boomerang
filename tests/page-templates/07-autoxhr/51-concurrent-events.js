/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/07-autoxhr/51-concurrent-events", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent 3 beacon (XMLHttpRequest !== null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 3);
			},
			this.skip.bind(this));
	});

	describe("Beacon 2 (spa)", function() {
		var i = 1;
		it("Should be a spa beacon", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.initiator"], "spa");
					done();
				},
				this.skip.bind(this));
		});

		it("Should have a t_done close to 400ms (if MutationObserver is supported)", function(done) {
			if (!t.isMutationObserverSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.operator(tf.beacons[i].t_done, ">=", 400);
					assert.closeTo(tf.beacons[i].t_done, 400, 200);
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 3 (xhr)", function() {
		var i = 2;
		it("Should be a xhr beacon", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.initiator"], "xhr");
					done();
				},
				this.skip.bind(this));
		});

		it("Should have a t_done close to 100ms (if MutationObserver is supported)", function(done) {
			if (!t.isMutationObserverSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.operator(tf.beacons[i].t_done, ">=", 100);
					assert.closeTo(tf.beacons[i].t_done, 100, 200);
					done();
				},
				this.skip.bind(this));
		});
	});
});
