/* eslint-env mocha */
/* global BOOMR,BOOMR_test,describe,it */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["eventFired"]);

describe("e2e/32-autoxhr-spa/07-click-xhr-no-dom.js", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should pass basic beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have sent 1 beacon (XMLHttpRequest !== null)", function(done) {
    this.timeout(10000);

    t.ifAutoXHR(
      done,
      function() {
        t.ensureBeaconCount(done, 1);
      },
      this.skip.bind(this));
  });

  describe("Beacon 1", function() {
    it("Should have http.initiator = spa_hard", function() {
      assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
    });
  });
});
