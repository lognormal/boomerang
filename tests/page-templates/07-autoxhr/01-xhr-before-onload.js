/*eslint-env mocha*/

describe("e2e/07-autoxhr/01-xhr-before-onload", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("page load beacon should fire before xhr beacon", function(done) {
		this.timeout(3000);
		tf.ifAutoXHR(
			done,
			function() {
				tf.ensureBeaconCount(done, 2,
					function() {
						tf.beaconFired(done, "page load beacon fired", function(b) {
							return b["rt.start"] === "navigtion" &&
								b["http.initiator"] === undefined &&
								b.u.indexOf("01-xhr-before-onload.html") > -1;
						});
						tf.beaconFired(done, "xhr beacon fired", function(b) {
							return b["rt.start"] === "manual" &&
								b["http.initiator"] === "xhr" &&
								b.u.indexOf("support/script200.js") > -1;
						});
						done();
					});
			});
	});

});
