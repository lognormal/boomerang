/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/13-logn-config/01-autorun-false", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function(done) {
		t.ensureBeaconCount(done, 1);
	});
});
