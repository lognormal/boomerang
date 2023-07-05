/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["usedPolyfilledSendBeacon", "hasNativeSendBeacon"]);

describe("e2e/01-beacon-type/07-sendbeacon-polyfill", function() {
  it("Should not have used a polyfilled navigator.sendBeacon if it is available", function() {
    if (!window.hasNativeSendBeacon) {
      return this.skip();
    }

    assert.isFalse(window.usedPolyfilledSendBeacon);
  });
});
