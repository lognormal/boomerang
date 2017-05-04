/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/01-beacon-type/00-resourcetiming-disabled", function() {
	it("Should send an beacon via navigator.sendBeacon if it is available", function(done) {
		if (window && window.navigator && typeof window.navigator.sendBeacon === "function") {
			// NOTE: Currently this doesn't work because the beacon isn't added to ResourceTiming in Chrome/Opera:
			// https://bugs.chromium.org/p/chromium/issues/detail?id=711060
			// BOOMR_test.validateBeaconWasSendBeacon(done);
		}
		else {
			done();
		}
	});
});
