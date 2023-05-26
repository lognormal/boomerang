/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/34-bfcache/02-dwell", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent 1 beacon", function(done) {
    t.ensureBeaconCount(done, 1);
  });

  describe("Beacon 1 - Page Load", function() {
    it("Should have been an Page Load beacon", function() {
      var b = tf.beacons[0];

      assert.isUndefined(b["http.initiator"]);
    });
  });
});
