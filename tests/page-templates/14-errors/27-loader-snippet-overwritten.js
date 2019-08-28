/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/14-errors/26-loader-snippet", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var C = BOOMR.utils.Compression;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have put the err on the beacon", function() {
		var b = tf.lastBeacon();
		assert.isDefined(b.err);
	});

	it("Should have had 3 errors", function() {
		var b = tf.lastBeacon();
		assert.equal(C.jsUrlDecompress(b.err).length, 3);
	});

	it("Should have called the original window.onerror for each error", function() {
		assert.equal(window.errorsLogged1, 3);
	});

	it("Should have called the second window.onerror for each error", function() {
		assert.equal(window.errorsLogged2, 3);
	});
});
