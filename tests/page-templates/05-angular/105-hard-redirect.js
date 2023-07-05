/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["onBeaconHandler", "testFrame"]);

describe("e2e/05-angular/105-hard-redirect", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;
  var assert = window.chai.assert;

  it("Should have sent one beacon", function(done) {
    this.timeout(10000);
    t.ensureBeaconCount(done, 1);
  });

  it("Should have included the redirection time in t_resp (if NavigationTiming is supported)", function() {
    if (t.isNavigationTimingSupported()) {
      assert.operator(tf.beacons[0].t_resp, ">=", 3000);
    }
  });

  it("Should not have a t_resp (if NavigationTiming is not supported)", function() {
    if (!t.isNavigationTimingSupported()) {
      assert.isUndefined(tf.beacons[0].t_resp);
    }
  });

  it("Should have t_resp + t_page = t_done (if NavigationTiming is supported)", function() {
    if (t.isNavigationTimingSupported()) {
      assert.equal(tf.beacons[0].t_done, tf.beacons[0].t_resp + tf.beacons[0].t_page);
    }
  });
});
