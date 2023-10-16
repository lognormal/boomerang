/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/34-bfcache/00-basic", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent two beacons", function(done) {
    t.ensureBeaconCount(done, 2);
  });

  describe("Beacon 1 - Page Load", function() {
    it("Should have been an Page Load beacon", function() {
      var b = tf.beacons[0];

      assert.isUndefined(b["http.initiator"]);
    });
  });

  describe("Beacon 1 - BFCache", function() {
    it("Should have been a BFCache beacon", function() {
      var b = tf.beacons[1];

      assert.equal(b["http.initiator"], "bfcache");
    });

    it("Should have set rt.start = manual", function() {
      var b = tf.beacons[1];

      assert.equal(b["rt.start"], "manual");
    });

    it("Should have set t_done = 100", function() {
      var b = tf.beacons[1];

      assert.equal(b.t_done, "100");
    });

    it("Should have set t_page = 100", function() {
      var b = tf.beacons[1];

      assert.equal(b.t_page, "100");
    });

    it("Should have set t_resp = 0", function() {
      var b = tf.beacons[1];

      assert.equal(b.t_resp, "0");
    });

    it("Should have set rt.tstart", function() {
      var b = tf.beacons[1];

      assert.isDefined(b["rt.start"]);
    });

    it("Should have set rt.end", function() {
      var b = tf.beacons[1];

      assert.isDefined(b["rt.end"]);
    });

    it("Should have set rt.end to be rt.tstart + t_done", function() {
      var b = tf.beacons[1];

      assert.equal(parseInt(b["rt.end"], 10), parseInt(b["rt.tstart"], 10) + parseInt(b.t_done));
    });

    it("Should have set nt_nav_type = 2", function() {
      var b = tf.beacons[1];

      assert.equal(b.nt_nav_type, "2");
    });

    it("Should have set pt.fcp > 0", function() {
      var b = tf.beacons[1];

      assert.operator(parseInt(b["pt.fcp"], 10), ">", 450);
    });

    it("Should have set pt.lcp > 0", function() {
      var b = tf.beacons[1];

      assert.operator(parseInt(b["pt.lcp"], 10), ">", 450);
    });

    it("Should have set u", function() {
      var b = tf.beacons[1];

      assert.equal(b.u, location.href);
    });

    it("Should have set rt.sl = 2", function() {
      var b = tf.beacons[1];

      assert.equal(b["rt.sl"], "2");
    });

    it("Should have set n = 2", function() {
      var b = tf.beacons[1];

      assert.equal(b.n, "2");
    });
  });
});
