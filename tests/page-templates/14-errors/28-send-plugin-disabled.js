/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/14-errors/28-send-plugin-disabled", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should not have put the err on the beacon", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b.err);
	});
});
