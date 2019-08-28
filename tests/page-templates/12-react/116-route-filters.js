/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/12-react/116-route-filters", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent three beacons", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 3);
			},
			this.skip.bind(this));
	});

	describe("Beacon 2 (spa)", function() {
		it("Should have sent the second beacon with a duration close to 1700ms", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.operator(tf.beacons[1].t_done, ">=", 1700);  // 1500 + 200 ms timeouts
					assert.operator(tf.beacons[1].t_done, "<", 2000);
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 3 (spa)", function() {
		it("Should have sent the second beacon with a duration close to 3500ms", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.operator(tf.beacons[2].t_done, ">=", 3500);  // 1500 timeout + 2s img
					assert.operator(tf.beacons[2].t_done, "<", 3800);
					done();
				},
				this.skip.bind(this));
		});
	});

});
