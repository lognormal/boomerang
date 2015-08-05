/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/07-autoxhr/03-xhr-before-onload", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Only the page load beacon should have been sent", function(done) {
		this.timeout(5000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(function() {
					var b = tf.beacons[0];

					assert.equal(b["rt.start"], "navigation");
					assert.isUndefined(b["http.initiator"]);
					assert.include(b.u, "03-xhr-before-onload.html");

					done();
				}, 1);
			});
	});

});
