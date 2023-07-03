/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/20-painttiming/08-lcp-spa-soft-no-hard-lcp", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;
  var C = BOOMR.utils.Compression;

  it("Should have sent three beacons", function(done) {
    this.timeout(10000);

    t.ensureBeaconCount(done, 3);
  });

  describe("Beacon 1 (Page Load)", function(){
    it("Should not have set pt.lcp", function() {
      assert.isUndefined(tf.beacons[0]["pt.lcp"]);
    });
  });

  describe("Beacon 2 (SPA Soft #1)", function(){
    it("Should not have set pt.lcp", function() {
      assert.isUndefined(tf.beacons[1]["pt.lcp"]);
    });
  });

  describe("Beacon 3 (SPA Soft #2)", function(){
    it("Should not have set pt.lcp", function() {
      assert.isUndefined(tf.beacons[2]["pt.lcp"]);
    });
  });
});
