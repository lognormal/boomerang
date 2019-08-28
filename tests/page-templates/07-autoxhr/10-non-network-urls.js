/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/10-non-network-urls", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 1 beacons", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 1);
			});
	});
});
