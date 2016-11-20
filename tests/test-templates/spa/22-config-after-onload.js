/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["22-config-after-onload"] = function() {
	var t = BOOMR_test;

	it("Should have sent 2 beacons (if MutationObserver is supported)", function(done) {
		this.timeout(10000);

		// 2 beacons because of the forced BOOMR.page_ready() call

		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 2);
			});
	});

	it("Should have sent 1 beacons (if MutationObserver is not supported)", function(done) {
		this.timeout(10000);

		t.ifAutoXHR(
			done,
			false,
			function() {
				t.ensureBeaconCount(done, 1);
			});
	});

	it("Should not have fired page_ready after onload", function() {
		assert.isFalse(BOOMR.plugins.hold.fired);
	});
};
