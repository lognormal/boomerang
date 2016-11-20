/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/07-autoxhr/10-img-src-change", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent 1 beacon", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done,  1);
	});
});
