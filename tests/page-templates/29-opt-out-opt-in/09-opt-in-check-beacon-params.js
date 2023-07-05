/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["BOOMR_CONSENT_CONFIG", "BOOMR_OPT_OUT", "BOOMR_OPT_IN"]);

describe("e2e/29-opt-out-opt-in/09-opt-in-check-beacon-params", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should pass Consent Inline Plugin validation", function(done) {
    t.validateConsentInlinePluginState(done);
  });

  it("Should have cip.in and cip.v on first beacon", function() {
    var b = tf.beacons[0];

    assert.equal(b["cip.in"], "1");
    assert.equal(b["cip.v"], "2");
  });

  it("Should NOT have cip.in and cip.v on second beacon", function() {
    var b = tf.beacons[1];

    assert.isUndefined(b["cip.in"]);
    assert.isUndefined(b["cip.v"]);
  });
});
