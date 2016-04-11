/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/14-errors/19-boomr-errors", function() {
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

	it("Should have had 4 errors", function() {
		var b = tf.lastBeacon();
		assert.equal(C.jsUrlDecompress(b.err).length, 4);
	});

	it("Should have each error with a count = 1", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));

		for (var i = 0; i < errs.length; i++) {
			assert.equal(errs[i].count, 1);
		}
	});

	it("Should have fileName of the page (if set)", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));

		for (var i = 0; i < errs.length; i++) {
			if (errs[i].fileName) {
				assert.include(errs[i].fileName, "19-boomr-errors.html");
			}
		}
	});

	it("Should have error #1 functionName of 'errorFunction'", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		if (err.functionName) {
			assert.include(err.functionName, "errorFunction");
		}
	});

	it("Should have error #2 functionName of 'BOOMRtest2'", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[1];

		if (err.functionName) {
			assert.include(err.functionName, "BOOMRtest2");
		}
	});

	it("Should have error #3 functionName of 'BOOMRtest3'", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[2];

		if (err.functionName) {
			assert.include(err.functionName, "BOOMRtest3");
		}
	});

	it("Should have error #4 functionName of 'BOOMRtest4'", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[3];

		if (err.functionName) {
			assert.include(err.functionName, "BOOMRtest4");
		}
	});

	it("Should have error #1 message", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.isDefined(err.message);
	});

	it("Should have error #2 message = 'Fault 2'", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[1];
		assert.equal(err.message, "Fault 2");
	});

	it("Should have error #3 message = 'Fault 3'", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[2];
		assert.equal(err.message, "Fault 3");
	});

	it("Should have error #4 message = 'Fault 4'", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[3];
		assert.equal(err.message, "Fault 4");
	});

	it("Should have source = BOOMERANG", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));

		for (var i = 0; i < errs.length; i++) {
			assert.equal(errs[i].source, BOOMR.plugins.Errors.SOURCE_BOOMERANG);
		}
	});

	it("Should have stack with the stack", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));

		for (var i = 0; i < errs.length; i++) {
			assert.isDefined(errs[i].stack);
		}
	});

	it("Should have not have BOOMR_plugins_errors_wrap on the stack", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));

		for (var i = 0; i < errs.length; i++) {
			assert.notInclude(errs[i].stack, "BOOMR_plugins_errors_wrap");
		}
	});

	it("Should have not have BOOMR_addError on the stack", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));

		for (var i = 0; i < errs.length; i++) {
			assert.notInclude(errs[i].stack, "BOOMR_addError");
		}
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

	it("Should have lineNumber ~ 40", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		if (err.lineNumber) {
			assert.closeTo(err.lineNumber, 40, 10);
		}
	});
});
