/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, [ "BOOMR_spa" ]);

describe("e2e/35-spa/00-delayed-boomerang", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have fired the 'spa_navigation' event with the timestamp of the navigationStart", function() {
    if (!t.isNavigationTimingSupported()) {
      return this.skip();
    }

    assert.equal(window.BOOMR_spa[0].requestStart, window.performance.timing.navigationStart);
  });
});
