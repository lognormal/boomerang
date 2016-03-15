/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/07-after-onload", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have put a Page Group on the beacon", function() {
		var b = tf.lastBeacon();
		assert.equal(b["h.pg"], "Match");
	});
});
