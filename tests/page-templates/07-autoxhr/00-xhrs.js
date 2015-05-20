/*eslint-env mocha*/

describe("e2e/07-autoxhr/00-xhrs", function() {
	var t = BOOMR_test;

	it("Should get 8 beacons: 1 onload, 7 xhr (XMLHttpRequest !== null)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 8);
			});
	});

	it("Should get 1 beacons: 1 onload, 0 xhr (XMLHttpRequest === null)", function(done) {
		t.ifAutoXHR(
			done,
			undefined,
			function() {
				t.ensureBeaconCount(done, 1);
			});
	});

});
