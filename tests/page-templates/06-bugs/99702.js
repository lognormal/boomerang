/*eslint-env mocha*/
/*global BOOMR_test,assert,BOOMR*/

describe("e2e/06-bugs/99702", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should have sent two beacons", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done,  2);
	});

	it("The second beacon shouldn't have a t_page", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b.t_page);
	});

	it("The second beacon should have t_page.inv set", function() {
		var b = tf.lastBeacon();
		assert.isDefined(b["t_page.inv"]);
	});
});
