/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/05-angular/26-bug", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent one beacon", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done,  1);
	});

	it("Should have a h.pg of MATCH", function() {
		var b = tf.lastBeacon();
		assert.equal(b["h.pg"], "MATCH");
	});
});
