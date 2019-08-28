/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/14-errors/46-error-during-onload", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var C = BOOMR.utils.Compression;

	it("Should have sent a single beacon", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have put the err on the beacon", function() {
		var b = tf.lastBeacon();
		assert.isDefined(b.err);
	});

	it("Should not have http.initiator type set to Error", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b["http.initiator"], "http.initiator should not be defined");

	});

	it("Should have had a single error", function() {
		var b = tf.lastBeacon();
		assert.equal(C.jsUrlDecompress(b.err).length, 1);
	});
});
