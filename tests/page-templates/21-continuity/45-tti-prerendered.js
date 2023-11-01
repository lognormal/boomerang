/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/21-continuity/45-tti-prerendered", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a single beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have set the Time to Interactive (c.tti), offset by Activation Start", function() {
    if (!t.isNavigationTimingSupported() || !t.isPrerenderingSupported()) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    assert.isDefined(b["c.tti"]);

    var tti = parseInt(b["c.tti"], 10);

    assert.operator(tti, ">=", 1);
    assert.operator(tti, "<=", 10000);
  });
});
