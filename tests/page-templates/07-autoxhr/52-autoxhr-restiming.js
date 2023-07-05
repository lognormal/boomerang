/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["xhr"]);

describe("e2e/07-autoxhr/52-autoxhr-restiming", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should get 2 beacons: 1 onload, 1 xhr (XMLHttpRequest !== null)", function(done) {
    this.timeout(10000);

    t.ifAutoXHR(
      done,
      function() {
        t.ensureBeaconCount(done, 2);
      },
      this.skip.bind(this));
  });

  it("Should get 1 beacons: 1 onload (XMLHttpRequest === null)", function(done) {
    this.timeout(10000);

    t.ifAutoXHR(
      done,
      this.skip.bind(this),
      function() {
        t.ensureBeaconCount(done, 1);
      });
  });

  it("Should have sent beacon 1 with restiming", function() {
    assert.isDefined(tf.beacons[0].restiming);
  });

  it("Should have sent beacon 2 with restiming", function() {
    assert.isDefined(tf.beacons[1].restiming);
  });
});
