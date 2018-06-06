/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/38-page-group-null", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should not set the Page Group to null", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b["h.pg"]);
	});
});
