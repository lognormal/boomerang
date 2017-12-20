/*eslint-env mocha*/
/*global BOOMR_test,assert,describe,it*/

describe("e2e/14-errors/24-autorun-false-multiple-then-load", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var C = BOOMR.utils.Compression;

	it("Should have sent two beacons", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 2);
	});

	it("Should have http.initiator = error on the first beacon", function() {
		var b = tf.beacons[0];
		assert.equal(b["http.initiator"], "error");
	});

	it("Should have put err on the first beacon", function() {
		var b = tf.beacons[0];
		assert.isDefined(b.err);
	});

	it("Should have two errors on the first beacon", function() {
		var b = tf.beacons[0];
		var errs = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err));
		assert.equal(errs.length, 2);
	});

	it("Should have an error count = 1 on the first beacon first error", function() {
		var b = tf.beacons[0];
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.count, 1);
	});

	it("Should have an error coming from the html page on the first beacon first error", function() {
		var b = tf.beacons[0];
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		if (err.fileName) {
			assert.include(err.fileName, window.location.pathname.substring(window.location.pathname.lastIndexOf("/") + 1));
		}
		else {
			return this.skip();
		}
	});

	it("Should have functionName of 'Global code' (if set) on the first beacon first error", function() {
		var b = tf.beacons[0];
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		if (err.functionName) {
			// not set in Chrome and FF, Edge = 'Global code', Safari = 'global code'
			assert.include(err.functionName.toLowerCase(), "global code");
		}
		else {
			return this.skip();
		}
	});

	it("Should have rt.end on the first beacon", function() {
		var b = tf.beacons[0];
		assert.isDefined(b["rt.end"]);
	});

	it("Should have rt.tstart on the first beacon", function() {
		var b = tf.beacons[0];
		assert.isDefined(b["rt.tstart"]);
	});

	it("Should have rt.start = manual on the first beacon", function() {
		var b = tf.beacons[0];
		assert.equal(b["rt.start"], "manual");
	});

	it("Should have no http.initiator the second beacon", function() {
		var b = tf.beacons[1];
		assert.isUndefined(b["http.initiator"]);
	});

	it("Should have rt.start=navigation on the second beacon (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			assert.equal(tf.beacons[1]["rt.start"], "navigation");
		}
		else {
			assert.equal(tf.beacons[1]["rt.start"], "none");
		}
	});

	it("Should have put NavigationTiming metrics on the second beacon (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			assert.isDefined(tf.beacons[1].nt_nav_st);
			assert.isDefined(tf.beacons[1].nt_load_st);
		}
		else {
			return this.skip();
		}
	});

	it("Should have rt.sl = 0 on the first beacon", function() {
		var b = tf.beacons[0];
		assert.equal(b["rt.sl"], 0);
	});

	it("Should have rt.sl = 1 on the second beacon", function() {
		var b = tf.beacons[1];
		assert.equal(b["rt.sl"], 1);
	});
});
