/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/14-errors/05-send-after-onload-multiple", function() {
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

	it("Should have had 3 errors", function() {
		var b = tf.lastBeacon();
		assert.equal(C.jsUrlDecompress(b.err).length, 3);
	});

	it("Should have set http.initiator = 'error' on the second beacon", function() {
		var b = tf.lastBeacon();
		assert.equal(b["http.initiator"], "error");
	});

	it("Should have the proper counts", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));

		assert.equal(errs[0].count, 3);
		assert.equal(errs[1].count, 1);
		assert.equal(errs[2].count, 1);
	});

	it("Should have all errors with the fileName of the page", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));

		for (var i = 0; i < errs.length; i++) {
			var err = errs[i];

			if (err.fileName) {
				assert.include(err.fileName, "05-send-after-onload-multiple.html");
			}
		}
	});

	it("Should have functionName of 'error-,function' if defined", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));

		for (var i = 0; i < errs.length; i++) {
			var err = errs[i];
			if (typeof err.functionName !== "undefined") {
				assert.include(err.functionName, "error-,function");
			}
		}
	});

	it("Should have message = 'ERROR!'", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));

		assert.equal(errs[0].message, "BOOM1");
		assert.equal(errs[1].message, "BOOM2");
		assert.equal(errs[2].message, "BOOM3");
	});

	it("Should have source = APP", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));

		for (var i = 0; i < errs.length; i++) {
			var err = errs[i];
			assert.equal(err.source, BOOMR.plugins.Errors.SOURCE_APP);
		}
	});

	it("Should have stack with the stack", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));

		for (var i = 0; i < errs.length; i++) {
			var err = errs[i];
			assert.isDefined(err.stack);
		}
	});

	it("Should have type = 'Error'", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));

		for (var i = 0; i < errs.length; i++) {
			var err = errs[i];
			assert.equal(err.type, "Error");
		}
	});

	it("Should have via = APP", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));

		for (var i = 0; i < errs.length; i++) {
			var err = errs[i];
			assert.equal(err.via, BOOMR.plugins.Errors.VIA_APP);
		}
	});

	it("Should have columNumber to be a number if specified", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));

		for (var i = 0; i < errs.length; i++) {
			var err = errs[i];
			if (typeof err.columnNumber !== "undefined") {
				assert.isTrue(err.columnNumber >= 0);
			}
		}
	});

	it("Should have lineNumber ~ 30", function() {
		var b = tf.lastBeacon();
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));

		for (var i = 0; i < errs.length; i++) {
			var err = errs[i];

			if (err.lineNumber) {
				assert.closeTo(err.lineNumber, 30, 5);
			}
		}
	});
});
