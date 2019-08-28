/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/14-errors/21-max-stack", function() {
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

	it("Should have had 1 error", function() {
		var b = tf.lastBeacon();
		assert.equal(C.jsUrlDecompress(b.err).length, 1);
	});

	it("Should have had a stack with a max length of around 5000 chars", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		// allow for some wiggle room in message length, but close to 5000
		assert.closeTo(err.stack.length, "a is not defined".length + 5000, 10, "stack: " + err.stack);
	});
});
