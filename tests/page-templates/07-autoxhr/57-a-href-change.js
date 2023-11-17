/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["listenersAdded", "listenersRemoved", "countListeners", "beaconNum"]);

describe("e2e/07-autoxhr/57-a-href-change", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent 2 beacons (if MutationObserver is supported)", function(done) {
    if (t.isMutationObserverSupported()) {
      this.timeout(10000);
      t.ensureBeaconCount(done,  2);
    }
    else {
      this.skip();
    }
  });

  it("Should have sent 1 beacon (if MutationObserver is not supported)", function(done) {
    if (!t.isMutationObserverSupported()) {
      this.timeout(10000);
      t.ensureBeaconCount(done,  1);
    }
    else {
      this.skip();
    }
  });

  it("Should have removed event listeners from main-image (if MutationObserver is supported)", function() {
    if (t.isMutationObserverSupported()) {
      assert.equal(window.listenersAdded, 2);  // 1 load + 1 error listeners
      assert.equal(window.listenersRemoved, 2);
    }
    else {
      this.skip();
    }
  });
});
