/* eslint-env mocha */
/* global BOOMR_test,assert,describe,it */

describe("e2e/14-errors/48-autorun-false-multiple-then-load-no-send-during-onload", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;
  var C = BOOMR.utils.Compression;

  it("Should have sent one beacon", function(done) {
    this.timeout(10000);
    t.ensureBeaconCount(done, 1);
  });

  it("Should have put err on the first beacon", function() {
    var b = tf.beacons[0];

    assert.isDefined(b.err);
  });

  it("Should have no http.initiator the first beacon", function() {
    var b = tf.beacons[0];

    assert.isUndefined(b["http.initiator"]);
  });

  it("Should have rt.start=navigation on the first beacon (if NavigationTiming is supported)", function() {
    if (t.isNavigationTimingSupported()) {
      assert.equal(tf.beacons[0]["rt.start"], "navigation");
    }
    else {
      assert.equal(tf.beacons[0]["rt.start"], "none");
    }
  });

  it("Should have put NavigationTiming metrics on the first beacon (if NavigationTiming is supported)", function() {
    if (t.isNavigationTimingSupported()) {
      assert.isDefined(tf.beacons[0].nt_nav_st);
      assert.isDefined(tf.beacons[0].nt_load_st);
    }
    else {
      return this.skip();
    }
  });

  it("Should have rt.sl = 1 on the first beacon", function() {
    var b = tf.beacons[0];

    assert.equal(b["rt.sl"], 1);
  });
});
