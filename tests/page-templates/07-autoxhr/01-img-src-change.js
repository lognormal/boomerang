/*eslint-env mocha*/

describe("e2e/07-autoxhr/01-img-src-change", function() {
	var t = BOOMR_test;

	it("Should get 2 beacons: 1 onload, 1 MO (XMLHttpRequest !== null)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 2);
			});
	});

	it("Should get 1 beacons: 1 onload, 1 MO (XMLHttpRequest === null)", function(done) {
		t.ifAutoXHR(
			done,
			undefined,
			function() {
				t.ensureBeaconCount(done, 2);
			});
	});



});
