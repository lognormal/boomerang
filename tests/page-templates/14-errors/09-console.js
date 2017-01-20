/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/14-errors/09-console", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var C = BOOMR.utils.Compression;

	it("Should have only sent one page load beacon", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 1);
	});

	it("Should have put the err on the page load beacon", function() {
		var b = tf.lastBeacon();
		assert.isDefined(b.err);
	});

	it("Should have had three errors", function() {
		var b = tf.lastBeacon();
		assert.equal(C.jsUrlDecompress(b.err).length, 3);
	});

	it("Should have count = 1 for the first error", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.count, 1);
	});

	it("Should have fileName of the page (if set) for the first error", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		if (err.fileName) {
			assert.include(err.fileName, "09-console.html");
		}
	});

	it("Should have functionName of 'errorFunction' for the first error", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		if (err.functionName) {
			assert.equal(err.functionName, "errorFunction");
		}
	});

	it("Should have message = 'Console error!' for the first error", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.include(err.message, "Console error!");
	});

	it("Should have source = APP for the first error", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.source, BOOMR.plugins.Errors.SOURCE_APP);
	});

	it("Should have stack with the stack for the first error", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.isDefined(err.stack);
	});

	it("Should not have BOOMR.window.console.error on the stack", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.notInclude(err.stack, "BOOMR.window.console.error");
	});

	it("Should not have the wrapped function in the stack for the first error", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.notInclude(err.stack, "BOOMR_plugins_errors");
	});

	it("Should have type = 'Error' for the first error", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.type, "Error");
	});

	it("Should have via = CONSOLE for the first error", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.via, BOOMR.plugins.Errors.VIA_CONSOLE);
	});

	it("Should have columNumber to be a number if specified for the first error", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		if (typeof err.columnNumber !== "undefined") {
			assert.isTrue(err.columnNumber >= 0);
		}
	});

	it("Should have lineNumber ~ 38 for the first error", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		if (err.lineNumber) {
			assert.closeTo(err.lineNumber, 38, 5);
		}
	});

	it("Should have message = 'Console error 2!' for the second error", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[1];
		assert.include(err.message, "Console error 2!,second arg");
	});

	it("Should have message = 'Console error 3!' for the third error", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[2];
		assert.include(err.message, "Console error 3!,second arg");
	});
});
