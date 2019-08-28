/*eslint-env mocha*/
/*global assert*/

describe("e2e/00-basic/06-responseend-before-pageload-beacon", function() {
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

	it("Should have the second beacon have a t_done of 0", function() {
		assert.closeTo(tf.beacons[1].t_done, 0, 1);
	});

	it("Should have the second beacon have a rt.tstart", function() {
		assert.operator(tf.beacons[1]["rt.tstart"], ">", 0);
	});

	it("Should have the second beacon have a rt.end", function() {
		assert.operator(tf.beacons[1]["rt.end"], ">", 0);
	});

	it("Should have the second beacon have a rt.tstart and rt.end be equal", function() {
		assert.closeTo(tf.beacons[1]["rt.tstart"], tf.beacons[1]["rt.end"], 1);
	});
});
