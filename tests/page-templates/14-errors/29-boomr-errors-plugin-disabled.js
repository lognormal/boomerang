/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/14-errors/29-boomr-errors-plugin-disabled", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should not have put the err on the beacon", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b.err);
	});

	it("Should have put the errors on the beacon", function() {
		var b = tf.lastBeacon();
		assert.isDefined(b.errors);
	});

	it("Should have had 4 errors", function() {
		var b = tf.lastBeacon();
		assert.equal(b.errors.split("\n").length, 4);
	});

	// the expected message in this test is browser specific and might need tweaking
	it("Should have error #1 match expected", function() {
		var b = tf.lastBeacon();
		var err = b.errors.split("\n")[0];
		assert.match(err, /^\[BOOMRtest:\d{13}\] ReferenceError: (?:'?a'? is not defined|Can't find variable: a|'?a'? is undefined)$/);
	});

	it("Should have error #2 match expected", function() {
		var b = tf.lastBeacon();
		var err = b.errors.split("\n")[1];
		assert.match(err, /^\[BOOMRtest2:\d{13}\] Fault 2$/);
	});

	it("Should have error #3 match expected", function() {
		var b = tf.lastBeacon();
		var err = b.errors.split("\n")[2];
		assert.match(err, /^\[BOOMRtest3:\d{13}\] Fault 3:: Extra stuff$/);
	});

	it("Should have error #4 match expected", function() {
		var b = tf.lastBeacon();
		var err = b.errors.split("\n")[3];
		assert.match(err, /^\[BOOMRtest4:\d{13}\] Fault 4:: \[object Object\]$/);
	});
});
