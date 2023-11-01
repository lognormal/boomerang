/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/21-continuity/46-ttfi-prerendered", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a single beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have set the Time to First Interaction (c.ttfi), offset by Activation Start", function() {
    if (!t.isNavigationTimingSupported() || !t.isPrerenderingSupported()) {
      return this.skip();
    }

    var b = tf.lastBeacon();

    assert.isDefined(b["c.ttfi"]);

    var ttfi = parseInt(b["c.ttfi"], 10);

    // we waited 2s to fire it, but activation took 1.9 second, so it should be between 0 and 1s
    var ttfiDispatchedAt = BOOMR_test.dispatchedAt;
    var activationStart = BOOMR_test.fakeActivationStartOffset;
    var calculatedTtfi = ttfiDispatchedAt - activationStart;

    assert.closeTo(ttfi, calculatedTtfi, 200);
  });
});
