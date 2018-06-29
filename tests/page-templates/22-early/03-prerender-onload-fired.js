/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/22-early/03-prerender-onload-fired", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent one beacons", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done,  1);
	});

	describe("Beacon 1 (page view)", function() {
		var i = 0;

		it("Should not be an early beacon", function() {
			var b = tf.beacons[i];
			assert.isUndefined(b.early);
		});

		it("Should have a h.pg of MYPAGEGROUP", function() {
			var b = tf.beacons[i];
			assert.equal(b["h.pg"], "MYPAGEGROUP");
		});

		it("Should have a vis.pre = 1", function() {
			var b = tf.beacons[i];
			assert.equal(b["vis.pre"], "1");
		});
	});
});
