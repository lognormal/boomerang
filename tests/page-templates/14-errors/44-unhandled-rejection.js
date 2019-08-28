/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/14-errors/44-unhandled-rejection", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var C = BOOMR.utils.Compression;

	it("Should have only sent one page load beacon", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 1);
	});

	it("Should have had a five errors (if PromiseRejectionEvent is supported)", function() {
		if (!window.Promise || !window.PromiseRejectionEvent) {
			this.skip();
		}
		var b = tf.lastBeacon();
		assert.isDefined(b.err);
		assert.equal(BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err)).length, 5);
	});

	it("Should have had a zero errors (if PromiseRejectionEvent is not supported)", function() {
		if (window.Promise && window.PromiseRejectionEvent) {
			this.skip();
		}
		var b = tf.lastBeacon();
		assert.isUndefined(b.err);
	});

	if (window.Promise  && window.PromiseRejectionEvent) {
		var ERRORS = [
			{ messageTest: function(msg) { assert.equal(msg, "error string"); } },

			{ func: "func2", line: 19, messageTest: function(msg) { assert.equal(msg, "error object"); } },

			{ messageTest: function(msg) { assert.equal(msg, "reject string"); } },

			{ line: 25, messageTest: function(msg) {
				// Chrome, Firefox == a is not defined, Safari = Can't find variable, Edge = 'a' is not defined
				assert.isTrue(
				    msg.indexOf("a is not defined") !== -1 ||
				    msg.indexOf("Can't find variable: a") !== -1 ||
				    msg.indexOf("'a' is undefined") !== -1 ||
				    msg.indexOf("'a' is not defined") !== -1);
			}},

			{ messageTest: function(msg) { assert.equal(msg, "[object Object]"); } }
		];

		/*eslint-disable no-loop-func */
		for (var n = 0; n < 5; n++) {
			(function(i) {
				describe("Beacon 1, Error " + (i + 1), function() {
					it("Should have count = 1", function() {
						var b = tf.lastBeacon();
						var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[i];
						assert.equal(err.count, 1);
					});

					it("Should have fileName of the page (if set)", function() {
						var b = tf.lastBeacon();
						var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[i];

						if (err.fileName) {
							assert.include(err.fileName, window.location.pathname.substring(window.location.pathname.lastIndexOf("/") + 1));
						}
						else {
							return this.skip();
						}
					});

					it("Should have correct functionName (if set)", function() {
						var b = tf.lastBeacon();
						var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[i];

						if (err.functionName) {
							assert.include(err.functionName, ERRORS[i].func);
						}
						else {
							return this.skip();
						}
					});

					it("Should have correct message", function() {
						var b = tf.lastBeacon();
						var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[i];
						ERRORS[i].messageTest(err.message);
					});

					it("Should have source = APP", function() {
						var b = tf.lastBeacon();
						var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[i];
						assert.equal(err.source, BOOMR.plugins.Errors.SOURCE_APP);
					});

					it("Should have stack with the stack", function() {
						var b = tf.lastBeacon();
						var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[i];
						assert.isDefined(err.stack);
					});

					it("Should have not have BOOMR_plugins_errors_wrap on the stack", function() {
						var b = tf.lastBeacon();
						var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[i];
						assert.notInclude(err.stack, "BOOMR_plugins_errors_wrap");
					});

					it("Should have correct type = 'ReferenceError' or 'Error'", function() {
						var b = tf.lastBeacon();
						var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[i];
						assert.isTrue(err.type === "ReferenceError" || err.type === "Error");
					});

					it("Should have via = REJECTION", function() {
						var b = tf.lastBeacon();
						var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[i];
						assert.equal(err.via, BOOMR.plugins.Errors.VIA_REJECTION);
					});

					it("Should have columNumber to be a number (if set)", function() {
						var b = tf.lastBeacon();
						var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[i];
						if (typeof err.columnNumber !== "undefined") {
							assert.isTrue(err.columnNumber >= 0);
						}
						else {
							return this.skip();
						}
					});

					it("Should have correct lineNumber (if set)", function() {
						var b = tf.lastBeacon();
						var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[i];

						if (err.lineNumber) {
							assert.closeTo(err.lineNumber, HEADER_LINES + ERRORS[i].line, 5);
						}
						else {
							return this.skip();
						}
					});
				});
			})(n);
		}
		/*eslint-enable no-loop-func */
	}
});
