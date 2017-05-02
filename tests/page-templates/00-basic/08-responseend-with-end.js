/*eslint-env mocha*/
/*global assert*/

describe("e2e/00-basic/08-responseend-with-end", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should have sent two beacons", function(done) {
		t.ensureBeaconCount(done, 2);
	});

	it("Should have the first beacon be a page load beacon", function() {
		if (t.isNavigationTimingSupported()) {
			assert.equal(tf.beacons[0]["rt.start"], "navigation");
		}
		else {
			assert.equal(tf.beacons[0]["rt.start"], "none");
		}
	});

	it("Should have the first beacon not have a http.initiator", function() {
		assert.isUndefined(tf.beacons[0]["http.initiator"]);
	});

	it("Should have the first beacon have the URL of the page", function() {
		assert.equal(tf.beacons[0].u, window.location.href);
	});

	it("Should have the second beacon be a manual beacon", function() {
		assert.equal(tf.beacons[1]["rt.start"], "manual");
	});

	it("Should have the second beacon be have the specified page group in xhr.pg", function() {
		assert.equal(tf.beacons[1]["xhr.pg"], "foo");
	});

	it("Should have the second beacon have a t_done of 1000", function() {
		assert.equal(tf.beacons[1].t_done, 1000);
	});

	it("Should have the second beacon have a rt.tstart", function() {
		assert.operator(tf.beacons[1]["rt.tstart"], ">", 0);
	});

	it("Should have the second beacon have a rt.end", function() {
		assert.operator(tf.beacons[1]["rt.end"], ">", 0);
	});

	it("Should have the second beacon have a rt.tstart and rt.end difference equal to 1000", function() {
		assert.equal(parseInt(tf.beacons[1]["rt.end"], 10) - parseInt(tf.beacons[1]["rt.tstart"], 10), 1000);
	});
});
