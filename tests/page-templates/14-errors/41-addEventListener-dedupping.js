/*eslint-env mocha*/

describe("e2e/14-errors/41-addEventListener-dedupping", function() {
	var tf = BOOMR.plugins.TestFramework;
	it("Should have only fired the foo handler once", function(done) {
		var b = tf.lastBeacon();
		assert.equal(b.foo, "bar");
		done();
	});
});
