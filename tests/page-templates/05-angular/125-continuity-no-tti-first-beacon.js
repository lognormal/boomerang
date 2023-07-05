/* eslint-env mocha */
/* global BOOMR,BOOMR_test,describe,it */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["angular", "ng339", "modules", "app", "called", "angular_imgs", "angular_nav_routes", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "workDone", "i"]);

describe("e2e/05-angular/125-continuity-no-tti-first-beacon.js", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should pass basic beacon validation", function(done) {
    t.validateBeaconWasSent(done);
    clearTimeout(window.timerid);
  });

  it("Should have sent three beacons", function() {
    assert.equal(tf.beacons.length, 3);
  });

  describe("Beacon 1", function() {
    it("Should have http.initiator = spa_hard", function() {
      assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
    });

    it("Should have set Time to Visually Ready (c.tti.vr)", function() {
      assert.isDefined(tf.beacons[0]["c.tti.vr"]);
    });

    it("Should not have set Time to Interactive (c.tti)", function() {
      if (t.isFirefox()) {
        // TTI isn't as reliable on Firefox because it can't use LongTasks or Page Busy monitoring
        return this.skip();
      }

      assert.isUndefined(tf.beacons[0]["c.tti"]);
    });
  });

  describe("Beacon 2", function() {
    it("Should have http.initiator = spa", function() {
      assert.equal(tf.beacons[1]["http.initiator"], "spa");
    });

    it("Should not have set Time to Visually Ready (c.tti.vr)", function() {
      assert.isUndefined(tf.beacons[1]["c.tti.vr"]);
    });

    it("Should not have set Time to Interactive (c.tti)", function() {
      assert.isUndefined(tf.beacons[1]["c.tti"]);
    });
  });

  describe("Beacon 3", function() {
    it("Should have http.initiator = spa", function() {
      assert.equal(tf.beacons[2]["http.initiator"], "spa");
    });

    it("Should not have set Time to Visually Ready (c.tti.vr)", function() {
      assert.isUndefined(tf.beacons[2]["c.tti.vr"]);
    });

    it("Should not have set Time to Interactive (c.tti)", function() {
      assert.isUndefined(tf.beacons[2]["c.tti"]);
    });
  });
});
