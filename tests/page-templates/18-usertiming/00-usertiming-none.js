/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["BOOMR_no_mark"]);

describe("e2e/18-usertiming/00-usertiming-none", function() {
  var t = BOOMR_test;
  var tf = BOOMR.plugins.TestFramework;

  it("Should pass basic beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should not have usertiming", function() {
    if (t.isUserTimingSupported()) {
      var b = tf.beacons[0];

      assert.equal(b.usertiming, undefined);
    }
  });
});
