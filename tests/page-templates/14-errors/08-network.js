/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/14-errors/08-network", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var C = BOOMR.utils.Compression;

	if (!BOOMR.plugins.AutoXHR) {
		it("Skipping on non-AutoXHR supporting browser", function() {
			return this.skip();
		});
		return;
	}

	it("Should have only sent three beacons, one page-load and two XHRs (if Fetch API is supported)", function(done) {
		if (!t.isFetchApiSupported()) {
			return this.skip();
		}
		this.timeout(10000);
		t.ensureBeaconCount(done, 3);
	});

	it("Should have only sent two beacons, one page-load and one XHR (if Fetch API is not supported)", function(done) {
		if (t.isFetchApiSupported()) {
			return this.skip();
		}
		this.timeout(10000);
		t.ensureBeaconCount(done, 2);
	});

	describe("Beacon 2 (xhr) for failed XHR request", function() {
		var i = 1;
		it("Should have put the err on the XHR beacon", function() {
			var b = tf.beacons[i];
			assert.isDefined(b.err);
		});

		it("Should have had a single error", function() {
			var b = tf.beacons[i];
			assert.equal(C.jsUrlDecompress(b.err).length, 1);
		});

		it("Should have count = 1", function() {
			var b = tf.beacons[i];
			var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
			assert.equal(err.count, 1);
		});

		it("Should have message = '/404'", function() {
			var b = tf.beacons[i];
			var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
			assert.include(err.message, "/404");
		});

		it("Should have source = APP", function() {
			var b = tf.beacons[i];
			var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
			assert.equal(err.source, BOOMR.plugins.Errors.SOURCE_APP);
		});

		it("Should have type = 'Error'", function() {
			var b = tf.beacons[i];
			var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
			assert.equal(err.type, "Error");
		});

		it("Should have via = NETWORK", function() {
			var b = tf.beacons[i];
			var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
			assert.equal(err.via, BOOMR.plugins.Errors.VIA_NETWORK);
		});

		it("Should have code = 404", function() {
			var b = tf.beacons[i];
			var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
			assert.equal(err.code, "404");
		});
	});

	describe("Beacon 3 (xhr) for failed Fetch request (if Fetch API is supported)", function() {
		var i = 2;
		it("Should have put the err on the XHR beacon", function() {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			var b = tf.beacons[i];
			assert.isDefined(b.err);
		});

		it("Should have had a single error", function() {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			var b = tf.beacons[i];
			assert.equal(C.jsUrlDecompress(b.err).length, 1);
		});

		it("Should have count = 1", function() {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			var b = tf.beacons[i];
			var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
			assert.equal(err.count, 1);
		});

		it("Should have message = '/404'", function() {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			var b = tf.beacons[i];
			var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
			assert.include(err.message, "/404");
		});

		it("Should have source = APP", function() {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			var b = tf.beacons[i];
			var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
			assert.equal(err.source, BOOMR.plugins.Errors.SOURCE_APP);
		});

		it("Should have type = 'Error'", function() {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			var b = tf.beacons[i];
			var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
			assert.equal(err.type, "Error");
		});

		it("Should have via = NETWORK", function() {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			var b = tf.beacons[i];
			var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
			assert.equal(err.via, BOOMR.plugins.Errors.VIA_NETWORK);
		});

		it("Should have code = 404", function() {
			var b = tf.beacons[i];
			var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
			assert.equal(err.code, "404");
		});
	});
});
