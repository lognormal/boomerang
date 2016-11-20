/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/14-errors/02-send-after-onload-enabled", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var C = BOOMR.utils.Compression;

	it("Should have sent two beacons", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 2);
	});

	it("Should have put the err on the second beacon", function() {
		var b = tf.lastBeacon();
		assert.isDefined(b.err);
	});

	it("Should have set http.initiator = 'error' on the second beacon", function() {
		var b = tf.lastBeacon();
		assert.equal(b["http.initiator"], "error");
	});

	it("Should have had a single error", function() {
		var b = tf.lastBeacon();
		assert.equal(C.jsUrlDecompress(b.err).length, 1);
	});

	it("Should have count = 1", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.count, 1);
	});

	it("Should have fileName of the page (if set)", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		if (err.fileName) {
			assert.include(err.fileName, "02-send-after-onload-enabled.html");
		}
	});

	it("Should have functionName of 'errorFunction'", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		if (err.functionName) {
			assert.equal(err.functionName, "errorFunction");
		}
	});

	it("Should have message = 'ERROR!'", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.message, "ERROR!");
	});

	it("Should have source = APP", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.source, BOOMR.plugins.Errors.SOURCE_APP);
	});

	it("Should have stack with the stack", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.isDefined(err.stack);
	});

	it("Should have type = 'Error'", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.type, "Error");
	});

	it("Should have via = APP", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.via, BOOMR.plugins.Errors.VIA_APP);
	});

	it("Should have columNumber to be a number if specified", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		if (typeof err.columnNumber !== "undefined") {
			assert.isTrue(err.columnNumber >= 0);
		}
	});

	it("Should have lineNumber ~ 31", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		if (err.lineNumber) {
			assert.closeTo(err.lineNumber, 31, 5);
		}
	});
});
