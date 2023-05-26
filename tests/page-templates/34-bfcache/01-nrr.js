/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/34-bfcache/01-nrr", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  var REASONS = "Unload handler,Unknown,id-id3,name-name4,frame-unknown";

  it("Should have sent one beacon", function(done) {
    t.ensureBeaconCount(done, 1);
  });

  describe("Beacon 1 - Page Load", function() {
    it("Should have been an Page Load beacon", function() {
      var b = tf.beacons[0];

      assert.isUndefined(b["http.initiator"]);
    });

    it("Should have set the NotRestoredReason", function() {
      var b = tf.beacons[0];

      assert.equal(b["bfc.nrr"], REASONS);
    });
  });

  it("Should have set BOOMR.plugins.BFCache.notRestoredReasons", function() {
    assert.equal(BOOMR.plugins.BFCache.notRestoredReasons(), REASONS);
  });
});
