/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/39-user-error", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have added an error to the beacon", function() {
		var b = tf.lastBeacon();
		assert.isDefined(b.err);
	});

	it("Should have set the error source to SOURCE_APP", function() {
		var C = BOOMR.utils.Compression;

		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.source, BOOMR.plugins.Errors.SOURCE_APP);
	});
});
