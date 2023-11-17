/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["listenersAdded", "listenersRemoved", "countListeners", "appendElementNode"]);

describe("e2e/07-autoxhr/58-element-nodes", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent 1 beacon", function(done) {
    this.timeout(10000);
    t.ensureBeaconCount(done,  1);
  });

  it("Should have removed event listeners from images (if MutationObserver is supported)", function() {
    if (t.isMutationObserverSupported()) {
      assert.equal(window.listenersAdded, 6);  // 3 load + 3 error listeners
      assert.equal(window.listenersRemoved, 6);
    }
    else {
      this.skip();
    }
  });
});
