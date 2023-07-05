/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["sendBeaconUrl", "sendBeaconData"]);

describe("e2e/01-beacon-type/05-beacon-type-get-no-nav-sendbeacon", function() {
  it("Should not send an beacon via navigator.sendBeacon when beacon type is GET", function() {
    if (window && window.navigator && typeof window.navigator.sendBeacon === "function") {
      assert.isUndefined(window.sendBeaconUrl, "Expected sendBeaconUrl to be undefined");
      assert.isUndefined(window.sendBeaconData, "Expected sendBeaconData to be undefined");
    }
  });
});
