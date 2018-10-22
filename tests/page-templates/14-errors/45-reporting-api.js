/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/14-errors/45-reporting-api", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var C = BOOMR.utils.Compression;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have put the err on the beacon", function() {
		if (!window.willReportDeprecation) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		assert.isDefined(b.err);
	});

	it("Should have had a single error", function() {
		if (!window.willReportDeprecation) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		assert.equal(C.jsUrlDecompress(b.err).length, 1);
	});

	it("Should have count = 1", function() {
		if (!window.willReportDeprecation) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.count, 1);
	});

	it("Should have had a recent timestamp", function() {
		if (!window.willReportDeprecation) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.closeTo(err.timestamp, BOOMR.now(), 10000);
	});

	it("Should have fileName of the page (if set)", function() {
		if (!window.willReportDeprecation) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		if (err.fileName) {
			assert.include(err.fileName, "45-reporting-api.html");
		}
		else {
			this.skip();
		}
	});

	it("Should have functionName of 'errorFunction'", function() {
		if (!window.willReportDeprecation) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		if (err.functionName) {
			assert.equal(err.functionName, "errorFunction");
		}
		else {
			this.skip();
		}
	});

	it("Should have correct message", function() {
		if (!window.willReportDeprecation) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.include(err.message, "chrome.loadTimes() is deprecated");
	});

	it("Should have source = APP", function() {
		if (!window.willReportDeprecation) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.source, BOOMR.plugins.Errors.SOURCE_APP);
	});

	it("Should have stack with the stack", function() {
		if (!window.willReportDeprecation) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		assert.isDefined(err.stack);
	});

	it("Should have type = 'Error'", function() {
		if (!window.willReportDeprecation) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.type, "Error");
	});

	it("Should have via = REPORTING", function() {
		if (!window.willReportDeprecation) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.via, BOOMR.plugins.Errors.VIA_REPORTING_API);
	});

	it("Should have columNumber to be a number if specified", function() {
		if (!window.willReportDeprecation) {
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

	it("Should have lineNumber ~ " + (HEADER_LINES + 7), function() {
		if (!window.willReportDeprecation) {
			return this.skip();
		}
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		if (err.lineNumber) {
			assert.closeTo(err.lineNumber, HEADER_LINES + 7, 5);
		}
		else {
			this.skip();
		}
	});
});
