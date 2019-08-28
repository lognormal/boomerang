/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/14-errors/43-errorevent", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var C = BOOMR.utils.Compression;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have put the err on the beacon (if ErrorEvent is supported)", function() {
		if (!window.ErrorEvent) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		assert.isDefined(b.err);
	});

	it("Should have had a single error (if ErrorEvent is supported)", function() {
		if (!window.ErrorEvent) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		assert.equal(C.jsUrlDecompress(b.err).length, 1);
	});

	it("Should have count = 1 (if ErrorEvent is supported)", function() {
		if (!window.ErrorEvent) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.count, 1);
	});

	it("Should have had a recent timestamp (if ErrorEvent is supported)", function() {
		if (!window.ErrorEvent) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.closeTo(err.timestamp, BOOMR.now(), 10000);
	});

	it("Should have a fileName (if ErrorEvent is supported)", function() {
		if (!window.ErrorEvent) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		if (err.fileName) {
			assert.include(err.fileName, "43-errorevent.html");
		}
		else {
			this.skip();
		}
	});

	it("Should have functionName of 'errorFunction' (if ErrorEvent is supported)", function() {
		if (!window.ErrorEvent) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		assert.equal(err.functionName, "errorFunction");
	});

	it("Should have message = 'errorMessage' (if ErrorEvent is supported)", function() {
		if (!window.ErrorEvent) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.message, "errorMessage");
	});

	it("Should have source = APP (if ErrorEvent is supported)", function() {
		if (!window.ErrorEvent) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.source, BOOMR.plugins.Errors.SOURCE_APP);
	});

	it("Should have stack with the stack (if ErrorEvent is supported)", function() {
		if (!window.ErrorEvent) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		assert.isDefined(err.stack);
	});

	it("Should have type = 'Error' (if ErrorEvent is supported)", function() {
		if (!window.ErrorEvent) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.type, "Error");
	});

	it("Should have via = GLOBAL_EXCEPTION_HANDLER (if ErrorEvent is supported)", function() {
		if (!window.ErrorEvent) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.via, BOOMR.plugins.Errors.VIA_GLOBAL_EXCEPTION_HANDLER);
	});

	it("Should have columNumber to be a number if specified (if ErrorEvent is supported)", function() {
		if (!window.ErrorEvent) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		if (typeof err.columnNumber !== "undefined") {
			assert.isTrue(err.columnNumber >= 0);
		}
		else {
			this.skip();
		}
	});

	it("Should have lineNumber 1234  (if ErrorEvent is supported)", function() {
		if (!window.ErrorEvent) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		if (err.lineNumber) {
			assert.closeTo(err.lineNumber, HEADER_LINES + 19, 5);
		}
		else {
			this.skip();
		}
	});
});
