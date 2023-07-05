/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["testFrame", "testFrameDoc"]);

describe("e2e/14-errors/26-freed-events", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  if (!window.addEventListener) {
    it("Skipping on browser that doesn't support addEventListener", function() {
      return this.skip();
    });

    return;
  }

  it("Should have only sent a page-load beacon", function(done) {
    this.timeout(10000);
    t.ensureBeaconCount(done, 1);
  });

  it("Should have no error on the page-load beacon", function() {
    var b = tf.lastBeacon();

    assert.isUndefined(b.err);
  });
});
