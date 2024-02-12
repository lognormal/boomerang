/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/34-bfcache/03-dimensions", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent three beacons", function(done) {
    t.ensureBeaconCount(done, 3);
  });

  describe("Beacon 1 - Page Load", function() {
    it("Should have been an Page Load beacon", function() {
      var b = tf.beacons[0];

      assert.isUndefined(b["http.initiator"]);
    });

    it("Should have set h.pg", function() {
      var b = tf.beacons[0];

      assert.equal(b["h.pg"], "PG1");
    });

    it("Should have set h.ab", function() {
      var b = tf.beacons[0];

      assert.equal(b["h.ab"], "A");
    });

    it("Should have set cdim.CD1", function() {
      var b = tf.beacons[0];

      assert.equal(b["cdim.CD1"], "true");
    });
  });

  describe("Beacon 2 - BFCache", function() {
    it("Should have been a BFCache beacon", function() {
      var b = tf.beacons[1];

      assert.equal(b["http.initiator"], "bfcache");
    });

    it("Should have set h.pg", function() {
      var b = tf.beacons[1];

      assert.equal(b["h.pg"], "PG1");
    });

    it("Should have set h.ab", function() {
      var b = tf.beacons[1];

      assert.equal(b["h.ab"], "A");
    });

    it("Should have set cdim.CD1", function() {
      var b = tf.beacons[1];

      assert.equal(b["cdim.CD1"], "true");
    });
  });

  describe("Beacon 3 - Manual", function() {
    it("Should have been a Manual beacon", function() {
      var b = tf.beacons[2];

      assert.equal(b["rt.start"], "manual");
    });

    it("Should have no h.pg", function() {
      var b = tf.beacons[2];

      assert.isUndefined(b["h.pg"]);
    });

    it("Should have no h.ab", function() {
      var b = tf.beacons[2];

      assert.isUndefined(b["h.ab"]);
    });

    it("Should have no cdim.CD1", function() {
      var b = tf.beacons[2];

      assert.isUndefined(b["cdim.CD1"]);
    });

    it("Should have no http.initiator", function() {
      var b = tf.beacons[2];

      assert.isUndefined(b["http.initiator"]);
    });

    it("Should have no t_page", function() {
      var b = tf.beacons[2];

      assert.isUndefined(b.t_page);
    });

    it("Should have no t_resp", function() {
      var b = tf.beacons[2];

      assert.isUndefined(b.t_resp);
    });

    it("Should have no nt_nav_type", function() {
      var b = tf.beacons[2];

      assert.isUndefined(b.nt_nav_type);
    });

    it("Should have no pt.fcp", function() {
      var b = tf.beacons[2];

      assert.isUndefined(b["pt.fcp"]);
    });

    it("Should have no pt.lcp", function() {
      var b = tf.beacons[2];

      assert.isUndefined(b["pt.lcp"]);
    });
  });
});
