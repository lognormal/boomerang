/* eslint-env mocha */
/* global BOOMR_test,describe,it,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["imgs", "html5_mode", "call_page_ready", "nav_routes", "disableBoomerangHook", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "boomr_t_done", "i"]);

describe("e2e/12-react/108-hard-nav-disable", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  var pathName = window.location.pathname;

  it("Should have sent three beacons", function(done) {
    this.timeout(10000);
    t.ensureBeaconCount(done, 3);
  });

  describe("Beacon 1 (page load)", function() {
    var i = 0;

    it("Should be navigation beacon", function() {
      var b = tf.beacons[i];

      if (t.isNavigationTimingSupported()) {
        assert.equal(b["rt.start"], "navigation");
      }
      else {
        assert.equal(b["rt.start"], "none");
      }

      assert.isUndefined(b["http.initiator"]);
    });

    it("Should have a t_done close to 'timestamp - navigationStart'", function() {
      var b = tf.beacons[i];

      if (t.isNavigationTimingSupported()) {
        var navStToBoomrTDoneDelta = window.boomr_t_done - window.performance.timing.navigationStart;

        assert.closeTo(navStToBoomrTDoneDelta, b.t_done, 100);
      }
    });
  });

  describe("Beacon 2 (spa)", function() {
    var i = 1;

    it("Should be soft navigation beacon", function() {
      var b = tf.beacons[i];

      assert.equal(b["http.initiator"], "spa");
    });

    it("Should have a t_done close to 1s", function() {
      var b = tf.beacons[i];

      assert.closeTo(b.t_done, 1000, 250);
    });
  });

  describe("Beacon 3 (spa)", function() {
    var i = 2;

    it("Should be soft navigation beacon", function() {
      var b = tf.beacons[i];

      assert.equal(b["http.initiator"], "spa");
    });

    it("Should have a t_done close to 500ms", function() {
      var b = tf.beacons[i];

      assert.closeTo(b.t_done, 500, 250);
    });
  });
});
