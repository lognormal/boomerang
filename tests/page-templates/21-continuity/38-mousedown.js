/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["md"]);

describe("e2e/21-continuity/38-mousedown", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a single beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should not have sent mousedown timeline (c.t.md)", function() {
    var b = tf.lastBeacon();

    assert.isUndefined(b["c.t.md"], "c.t.md should have been present");
  });

  it("Should have sent FID metric for mousedown interaction (c.fid)", function() {
    var b = tf.lastBeacon();

    assert.isDefined(b["c.fid"], "c.fid should have been present");
  });
});
