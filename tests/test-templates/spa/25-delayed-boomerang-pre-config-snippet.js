/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["25-delayed-boomerang-pre-config-snippet"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent two beacons", function(done) {
		this.timeout(10000);

		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 2);
			});
	});

	it("Should have had the first beacon be a spa_hard beacon", function() {
		var b = tf.beacons[0];
		assert.equal(b["http.initiator"], "spa_hard");
		assert.include(b.u, "25-delayed-boomerang-pre-config-snippet.html");
		assert.isUndefined(b.pgu);
	});

	it("Should have had the second beacon was an xhr beacon", function() {
		var b = tf.beacons[1];
		assert.equal(b["http.initiator"], "xhr");
		assert.equal(b["rt.tstart"], 5);
		assert.equal(b["rt.start"], "manual");
		assert.equal(b.t_resp, 5);
		assert.equal(b.t_done, 5);
		assert.equal(b.u, "http://foo.com/xhr/");
		assert.include(b.pgu, "25-delayed-boomerang-pre-config-snippet.html");
	});
};
