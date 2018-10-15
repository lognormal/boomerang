/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/46-iframes-reused", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 2 beacons: 1 onload, 1 xhr (XMLHttpRequest !== null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 2);
			},
			this.skip.bind(this));
	});

	it("Should get 1 beacons: 1 onload (XMLHttpRequest === null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			this.skip.bind(this),
			function() {
				t.ensureBeaconCount(done, 1);
			});
	});

	describe("Beacon 2", function() {
		var i = 1;
		it("Should have the second beacon be an XHR", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.initiator"], "xhr");
					done();
				},
				this.skip.bind(this));
		});

		it("Should have t_done not include the re-used iframe time (be greater than 1s but less than 60s)", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.operator(tf.beacons[i].t_done, ">=", 1000);
					assert.operator(tf.beacons[i].t_done, "<", 60000);
					done();
				},
				this.skip.bind(this));
		});
	});
});
