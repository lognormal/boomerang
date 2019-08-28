/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/01-beacon-type/05-beacon-type-get-no-nav-sendBeacon", function() {
	it("Should not send an beacon via navigator.sendBeacon when beacon type is GET", function() {
		if (window && window.navigator && typeof window.navigator.sendBeacon === "function") {
			assert.isUndefined(window.sendBeaconUrl, "Expected sendBeaconUrl to be undefined");
			assert.isUndefined(window.sendBeaconData, "Expected sendBeaconData to be undefined");
		}
	});
});
