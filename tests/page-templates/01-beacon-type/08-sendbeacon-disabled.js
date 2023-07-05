/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["sentViaSendBeacon", "supportNativeSendBeacon"]);

describe("e2e/01-beacon-type/08-sendbeacon-disabled", function() {
  it("Should send an beacon via XHR even if navigator.sendBeacon is available", function() {
    if (window && window.supportNativeSendBeacon) {
      assert.isFalse(window.sentViaSendBeacon);
    }
    else {
      this.skip();
    }
  });
});
