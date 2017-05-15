/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/00-basic/10-method-queue", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should have sent a beacon", function() {
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should support entries queued up before boomerang loaded", function() {
		var b = tf.lastBeacon();
		assert.equal(b.var1, "value1");
		assert.equal(b.var2, "value2");
	});

	it("Should support calls to `push()` after boomerang loaded", function() {
		var b = tf.lastBeacon();
		assert.equal(b.var3, "value3");
		assert.equal(b.var4, "value4");
	});
});
