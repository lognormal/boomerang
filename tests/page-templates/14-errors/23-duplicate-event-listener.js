/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/14-errors/23-duplicate-event-listener", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var C = BOOMR.utils.Compression;

	function findError(errs, name) {
		for (var i = 0; i < errs.length; i++) {
			if (errs[i] && errs[i].functionName && errs[i].functionName.indexOf(name) !== -1) {
				return errs[i];
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

	it("Should have had 4 errors (if the error stack is supported)", function() {
		var b = tf.lastBeacon();
		var errs = C.jsUrlDecompress(b.err);
		if (errs.length === 1 && errs[0].n === 5) {
			// older browsers won't have function name so they'll all collapse
			// into the same error
			return this.skip();
		}

		assert.equal(errs.length, 4);
	});

	it("Should have had 1 error (if the error stack is NOT supported)", function() {
		var b = tf.lastBeacon();
		var errs = C.jsUrlDecompress(b.err);

		if (errs.length === 4) {
			return this.skip();
		}

		assert.equal(errs.length, 1);

		var err = BOOMR.plugins.Errors.decompressErrors(errs)[0];
		assert.equal(err.count, 5);
	});

	it("Should have errorFunction1 have count = 2 (if the error stack is supported)", function() {
		var b = tf.lastBeacon();
		var errs = C.jsUrlDecompress(b.err);
		if (errs.length === 1 && errs[0].n === 5) {
			// older browsers won't have function name so they'll all collapse
			// into the same error
			return this.skip();
		}

		var err = findError(BOOMR.plugins.Errors.decompressErrors(errs), "errorFunction1");

		assert.isDefined(err);
		assert.include(err.functionName, "errorFunction1");
		assert.include(err.stack, "errorFunction1");
		assert.equal(err.count, 2);
	});

	it("Should have errorFunction2 have count = 1 (if the error stack is supported)", function() {
		var b = tf.lastBeacon();
		var errs = C.jsUrlDecompress(b.err);
		if (errs.length === 1 && errs[0].n === 5) {
			// older browsers won't have function name so they'll all collapse
			// into the same error
			return this.skip();
		}

		var err = findError(BOOMR.plugins.Errors.decompressErrors(errs), "errorFunction2");

		assert.isDefined(err);
		assert.include(err.functionName, "errorFunction2");
		assert.include(err.stack, "errorFunction2");
		assert.equal(err.count, 1);
	});

	it("Should have errorFunction3 have count = 1 (if the error stack is supported)", function() {
		var b = tf.lastBeacon();
		var errs = C.jsUrlDecompress(b.err);
		if (errs.length === 1 && errs[0].n === 5) {
			// older browsers won't have function name so they'll all collapse
			// into the same error
			return this.skip();
		}

		var err = findError(BOOMR.plugins.Errors.decompressErrors(errs), "errorFunction3");

		assert.isDefined(err);
		assert.include(err.functionName, "errorFunction3");
		assert.include(err.stack, "errorFunction3");
		assert.equal(err.count, 1);
	});

	it("Should have errorFunction4 have count = 1 (if the error stack is supported)", function() {
		var b = tf.lastBeacon();
		var errs = C.jsUrlDecompress(b.err);
		if (errs.length === 1 && errs[0].n === 5) {
			// older browsers won't have function name so they'll all collapse
			// into the same error
			return this.skip();
		}

		var err = findError(BOOMR.plugins.Errors.decompressErrors(errs), "errorFunction4");

		assert.isDefined(err);
		assert.include(err.functionName, "errorFunction4");
		assert.include(err.stack, "errorFunction4");
		assert.equal(err.count, 1);
	});
});
