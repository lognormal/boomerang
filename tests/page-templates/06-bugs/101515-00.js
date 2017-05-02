/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/101515-00", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should get 2 beacons: 1 xhr, 1 post-'prerender'", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 2);
	});

	it("Should have the first beacon be a Page Load beacon", function() {
		assert.isUndefined(tf.beacons[0]["http.initiator"]);
	});

	it("Should have the first beacon contain vis.pre", function() {
		assert.equal(tf.beacons[0]["vis.pre"], 1);
	});

	it("Should have the second beacon be a xhr beacon", function() {
		assert.equal(tf.beacons[1]["http.initiator"], "xhr");
	});

	it("Should have the second beacon with non negative t_page", function() {
		if (tf.beacons[1].t_page) {
			assert.operator(parseInt(tf.beacons[1].t_page, 10), ">=", 0, "t_page is not negative");
		}
	});
});
