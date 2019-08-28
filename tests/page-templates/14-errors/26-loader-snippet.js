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

	it("Should have count = 1 for each error", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));
		for (var i = 0; i < 3; i++) {
			var err = errs[i];
			assert.equal(err.count, 1);
		}
	});

	it("Should have fileName of the page (if set) for each error", function() {
		var b = tf.lastBeacon(), found = false;
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));
		for (var i = 0; i < 3; i++) {
			var err = errs[i];

			if (err.fileName) {
				assert.include(err.fileName, window.location.pathname.substring(window.location.pathname.lastIndexOf("/") + 1));
				found = true;
			}
		}
		if (!found) {
			return this.skip();
		}
	});

	it("Should have functionName of 'errorFunction' for each error", function() {
		var b = tf.lastBeacon(), found = false;
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));
		for (var i = 0; i < 3; i++) {
			var err = errs[i];

			if (err.functionName) {
				assert.include(err.functionName, "errorFunction");
				found = true;
			}
		}
		if (!found) {
			return this.skip();
		}
	});

	it("Should have message = 'a is not defined' or 'Can't find variable: a' or ''a' is undefined' for each error", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));
		for (var i = 0; i < 3; i++) {
			var err = errs[i];

			// Chrome, Firefox == a is not defined, Safari = Can't find variable, Edge = 'a' is not defined
			assert.isTrue(
				err.message.indexOf("a is not defined") !== -1 ||
				err.message.indexOf("Can't find variable: a") !== -1 ||
				err.message.indexOf("'a' is undefined") !== -1 ||
				err.message.indexOf("'a' is not defined") !== -1);
		}
	});

	it("Should have source = APP for each error", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));
		for (var i = 0; i < 3; i++) {
			var err = errs[i];

			assert.equal(err.source, BOOMR.plugins.Errors.SOURCE_APP);
		}
	});

	it("Should have stack with the stack for each error", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));
		for (var i = 0; i < 3; i++) {
			var err = errs[i];

			assert.isDefined(err.stack);
		}
	});

	it("Should have type = 'ReferenceError' or 'Error' for each error", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));
		for (var i = 0; i < 3; i++) {
			var err = errs[i];

			// Chrome, Firefox == ReferenceError, Safari = Error
			assert.isTrue(err.type === "ReferenceError" || err.type === "Error");
		}
	});

	it("Should have via = GLOBAL_EXCEPTION_HANDLER for each error", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));
		for (var i = 0; i < 3; i++) {
			var err = errs[i];

			assert.equal(err.via, BOOMR.plugins.Errors.VIA_GLOBAL_EXCEPTION_HANDLER);
		}
	});

	it("Should have columNumber to be a number if specified for each error", function() {
		var b = tf.lastBeacon(), found = false;
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));
		for (var i = 0; i < 3; i++) {
			var err = errs[i];

			if (typeof err.columnNumber !== "undefined") {
				assert.isTrue(err.columnNumber >= 0);
				found = true;
			}
		}
		if (!found) {
			return this.skip();
		}
	});

	it("Should have called the original window.onerror for each error", function() {
		assert.equal(window.errorsLogged, 3);
	});
});
