/* eslint-env mocha */
/* global BOOMR_test,t_visible */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["t_visible"]);

describe("e2e/22-early/02-prerender-onload-not-fired", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent two beacons", function(done) {
    this.timeout(10000);
    t.ensureBeaconCount(done,  2);
  });

  describe("Beacon 1 (early)", function() {
    var i = 0;

    it("Should be an early beacon", function() {
      var b = tf.beacons[i];

      assert.isDefined(b.early);
    });

    // the following tests are only executed if mPulse's PageParams plugin exists
    if (BOOMR.plugins.PageParams) {
      it("Should have a h.pg of MYPAGEGROUP", function() {
        var b = tf.beacons[i];

        assert.equal(b["h.pg"], "MYPAGEGROUP");
      });
    }

    it("Should have a vis.pre = 1", function() {
      var b = tf.beacons[i];

      assert.equal(b["vis.pre"], "1");
    });

    // it("Should have been sent after visible event", function() {
    //   // TODO
    // });
  });

  describe("Beacon 2 (page view)", function() {
    var i = 1;

    it("Should not be an early beacon", function() {
      var b = tf.beacons[i];

      assert.isUndefined(b.early);
    });

    // the following tests are only executed if mPulse's PageParams plugin exists
    if (BOOMR.plugins.PageParams) {
      it("Should have a h.pg of MYPAGEGROUP", function() {
        var b = tf.beacons[i];

        assert.equal(b["h.pg"], "MYPAGEGROUP");
      });
    }

    it("Should have a vis.pre = 1", function() {
      var b = tf.beacons[i];

      assert.equal(b["vis.pre"], "1");
    });
  });
});
