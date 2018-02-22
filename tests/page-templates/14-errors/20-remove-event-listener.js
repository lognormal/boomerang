/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/14-errors/20-remove-event-listener", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var C = BOOMR.utils.Compression;

	function getError(error, regex) {
		var errors = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(error));
		for (var i = 0; i < errors.length; i++) {
			if (regex.test(errors[i].stack)) {
				return errors[i];
			}
		}
	}

	if (!window.addEventListener) {
		it("Skipping on browser that doesn't support addEventListener", function() {
			return this.skip();
		});

		return;
	}

	it("Should have only sent one page load beacon", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 1);
	});

	it("Should have put the err on the page load beacon", function() {
		var b = tf.lastBeacon();
		assert.isDefined(b.err);
	});

	it("Should have had 4 errors", function() {
		var b = tf.lastBeacon();
		assert.equal(C.jsUrlDecompress(b.err).length, 4);
	});

	it("Should have errorFunction1 have count = 1", function() {
		var b = tf.lastBeacon();
		var err = getError(b.err, /errorFunction1/);
		assert.equal((err && err.count) || 0, 1);
	});

	it("Should have errorFunction2 have count = 1", function() {
		var b = tf.lastBeacon();
		var err = getError(b.err, /errorFunction2/);
		assert.equal((err && err.count) || 0, 1);
	});

	it("Should have errorFunction3 have count = 1", function() {
		var b = tf.lastBeacon();
		var err = getError(b.err, /errorFunction3/);
		assert.equal((err && err.count) || 0, 1);
	});

	it("Should have errorFunction4 have count = 1", function() {
		var b = tf.lastBeacon();
		var err = getError(b.err, /errorFunction4/);
		assert.equal((err && err.count) || 0, 1);
	});

	it("Should not have errorFunction5", function() {
		var b = tf.lastBeacon();
		var err = getError(b.err, /errorFunction5/);
		assert.isUndefined(err);
	});

	// informational
	it("INFO: addEventListener passive flag was tested for errorFunction5", function() {
		if (!window.aELPassiveSupported) {
			this.skip();
		}
	});

	// informational
	it("INFO: addEventListener capture flag was tested for errorFunction5", function() {
		if (!window.aELCaptureSupported) {
			this.skip();
		}
	});
});
