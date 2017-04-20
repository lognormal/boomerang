/*eslint-env mocha*/
/*global BOOMR_test,assert,describe,it*/

describe("e2e/14-errors/23-autorun-false", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var C = BOOMR.utils.Compression;

	it("Should have sent one beacon", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 1);
	});

	it("Should have http.initiator = error", function() {
		var b = tf.lastBeacon();
		assert.equal(b["http.initiator"], "error");
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
			assert.include(err.fileName, "23-autorun-false.html");
		}

		if (err.functionName) {
			assert.include(err.functionName, "badFunction");
		}
	});

	it("Should have rt.end", function() {
		var b = tf.lastBeacon();
		assert.isDefined(b["rt.end"]);
	});

	it("Should have rt.sl = 0", function() {
		var b = tf.lastBeacon();
		assert.equal(b["rt.sl"], 0);
	});

	it("Should have rt.tstart", function() {
		var b = tf.lastBeacon();
		assert.isDefined(b["rt.tstart"]);
	});

	it("Should have rt.start = manual", function() {
		var b = tf.lastBeacon();
		assert.equal(b["rt.start"], "manual");
	});
});
