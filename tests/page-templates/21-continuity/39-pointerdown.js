/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["pd", "pu"]);

describe("e2e/21-continuity/39-pointerdown", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a single beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should not have sent pointerdown timeline (c.t.pd)", function() {
    var b = tf.lastBeacon();

    assert.isUndefined(b["c.t.pd"], "c.t.pd should not have been present");
  });

  it("Should have sent FID metric for pointerdown interaction (c.fid)", function() {
    var b = tf.lastBeacon();

    assert.isDefined(b["c.fid"], "c.fid should have been present");
  });
});
