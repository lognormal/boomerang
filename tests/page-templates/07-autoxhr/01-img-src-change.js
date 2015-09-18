/*eslint-env mocha*/

describe("e2e/07-autoxhr/01-img-src-change", function() {
	var t = BOOMR_test;

	it("Should get 2 beacons: 1 onload, 1 MO (AutoXHR and MutationObserver are supported)", function(done) {
		this.timeout(10000);
		if (typeof window.MutationObserver !== "undefined") {
			t.ifAutoXHR(
				done,
				function() {
					t.ensureBeaconCount(done, 2);
				});
		}
		else {
			done();
		}
	});

	it("Should get 2 beacons: 1 onload, 1 spa (AutoXHR is supported but MutationObserver is not)", function(done) {
		if (typeof window.MutationObserver === "undefined") {
			t.ifAutoXHR(
				done,
				function() {
					t.ensureBeaconCount(done, 2);
				});
		}
		else {
			done();
		}
	});

	it("Should get 1 beacons: 1 onload (AutoXHR is not supported)", function(done) {
		t.ifAutoXHR(
			done,
			undefined,
			function() {
				t.ensureBeaconCount(done, 1);
			});
	});
});
