/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/21-errors", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent two beacons", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 2);
	});

	it("Should have put the err on the second beacon", function() {
		var b = tf.lastBeacon();
		assert.isDefined(b.err);
	});

	it("Should set the Page Group to 'ABC' on the first beacon", function() {
		var b = tf.beacons[0];
		assert.equal(b["h.pg"], "ABC");
	});

	it("Should set the Page Group to 'ABC' on the second beacon", function() {
		var b = tf.beacons[1];
		assert.equal(b["h.pg"], "ABC");
	});

	it("Should set the AB test to 'A' on the first beacon", function() {
		var b = tf.beacons[0];
		assert.equal(b["h.ab"], "A");
	});

	it("Should set the AB test to 'A' on the second beacon", function() {
		var b = tf.beacons[1];
		assert.equal(b["h.ab"], "A");
	});

	it("Should set the Custom Dimension to 'B' on the first beacon", function() {
		var b = tf.beacons[0];
		assert.equal(b["cdim.CD1"], "B");
	});

	it("Should set the Custom Dimension to 'B' on the second beacon", function() {
		var b = tf.beacons[1];
		assert.equal(b["cdim.CD1"], "B");
	});

	it("Should set the Custom Timer to 123 on the first beacon", function() {
		var b = tf.beacons[0];
		assert.include(b.t_other, "123");
	});

	it("Should not include the Custom Timer on the second beacon", function() {
		var b = tf.beacons[1];
		assert.isUndefined(b.t_other);
	});

	it("Should set the Custom Metric to '456' on the first beacon", function() {
		var b = tf.beacons[0];
		assert.equal(b.cmet1, "456");
	});

	it("Should not set the Custom Metric on the second beacon", function() {
		var b = tf.beacons[1];
		assert.isUndefined(b.cmet1);
	});
});
