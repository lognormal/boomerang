/*eslint-env mocha*/
/*global BOOMR_test,assert,describe,it*/

describe("e2e/14-errors/25-autorun-false-onload-happens", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var C = BOOMR.utils.Compression;

	it("Should have sent one beacon", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 1);
	});

	it("Should have no http.initiator", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b["http.initiator"]);
	});

	it("Should have put err on the beacon", function() {
		var b = tf.lastBeacon();
		assert.isDefined(b.err);
	});

	it("Should have an error count = 1", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];
		assert.equal(err.count, 1);
	});

	it("Should have an error coming from the html page", function() {
		var b = tf.lastBeacon();
		var err = BOOMR.plugins.Errors.decompressErrors(C.jsUrlDecompress(b.err))[0];

		if (err.fileName) {
			assert.include(err.fileName, "25-autorun-false-onload-happens.html");
		}

		if (err.functionName) {
			assert.include(err.functionName, "badFunction");
		}
	});

	it("Should have rt.sl = 1", function() {
		var b = tf.lastBeacon();
		assert.equal(b["rt.sl"], 1);
	});

	it("Should have rt.end", function() {
		var b = tf.lastBeacon();
		assert.isDefined(b["rt.end"]);
	});

	it("Should have rt.tstart (if NavigationTiming is supported)", function() {
		var b = tf.lastBeacon();
		if (t.isNavigationTimingSupported()) {
			assert.isDefined(b["rt.tstart"]);
		}
	});

	it("Should have rt.start=navigation (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			assert.equal(tf.beacons[0]["rt.start"], "navigation");
		}
		else {
			assert.equal(tf.beacons[0]["rt.start"], "none");
		}
	});

	it("Should have put NavigationTiming metrics on the beacon (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			assert.isDefined(tf.beacons[0].nt_nav_st);
			assert.isDefined(tf.beacons[0].nt_load_st);
		}
	});
});
