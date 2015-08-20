/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/07-autoxhr/04-xhr-before-onload-configured", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should have sent two beacons, XHR and Page Load", function(done) {
		this.timeout(5000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(function() {
					var b1 = tf.beacons[0];
					var b2 = tf.beacons[1];

					assert.equal(b1["rt.start"], "manual");
					assert.equal(b1["http.initiator"], "xhr");
					assert.include(b1.u, "script200.js");
					assert.include(b1.pgu, "04-xhr-before-onload-configured.html");

					assert.equal(b2["rt.start"], "navigation");
					assert.isUndefined(b2["http.initiator"]);
					assert.include(b2.u, "04-xhr-before-onload-configured.html");

					done();
				}, 2);
			});
	});

});
