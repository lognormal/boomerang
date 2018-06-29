/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/22-early/12-addVar", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent three beacons", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done,  3);
	});

	describe("Beacon 1 (early)", function() {
		var i = 0;

		it("Should be an early beacon", function() {
			var b = tf.beacons[i];
			assert.isDefined(b.early);
		});

		it("Should have the persistent addVar", function() {
			var b = tf.beacons[i];
			assert.equal(b.multi, "a");
		});

		it("Should have the non-persistent addVar", function() {
			var b = tf.beacons[i];
			assert.equal(b.single, "b");
		});

		it("Should not have addVars that were added later", function() {
			var b = tf.beacons[i];
			assert.isUndefined(b.multi2);
			assert.isUndefined(b.single2);
		});
	});

	describe("Beacon 2 (page view)", function() {
		var i = 1;

		it("Should not be an early beacon", function() {
			var b = tf.beacons[i];
			assert.isUndefined(b.early);
		});

		it("Should have the persistent addVar", function() {
			var b = tf.beacons[i];
			assert.equal(b.multi, "a");
		});

		it("Should have the non-persistent addVar", function() {
			var b = tf.beacons[i];
			assert.equal(b.single, "b");
		});

		it("Should not have addVars that were added later", function() {
			var b = tf.beacons[i];
			assert.isUndefined(b.multi2);
			assert.isUndefined(b.single2);
		});
	});

	describe("Beacon 3 (responseEnd)", function() {
		var i = 2;

		it("Should not be an early beacon", function() {
			var b = tf.beacons[i];
			assert.isUndefined(b.early);
		});

		it("Should be a responseEnd beacon", function() {
			var b = tf.beacons[i];
			assert.equal(b["rt.start"], "manual");
			assert.equal(b["xhr.pg"], "foo");
		});

		it("Should have the persistent addVar", function() {
			var b = tf.beacons[i];
			assert.equal(b.multi, "a");
		});

		it("Should not have the non-persistent addVar", function() {
			var b = tf.beacons[i];
			assert.isUndefined(b.single);
		});

		it("Should have addVars added for this beacon", function() {
			var b = tf.beacons[i];
			assert.equal(b.multi2, "c");
			assert.equal(b.single2, "d");
		});
	});
});
