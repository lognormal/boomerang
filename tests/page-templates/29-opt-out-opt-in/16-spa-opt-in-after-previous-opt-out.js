/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["BOOMR_CONSENT_CONFIG", "BOOMR_OPT_OUT", "BOOMR_OPT_IN", "testRunOnce", "eventFired", "i"]);

describe("e2e/29-opt-out-opt-in/16-spa-opt-in-after-previous-opt-out", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should pass Consent Inline Plugin validation", function(done) {
    t.validateConsentInlinePluginState(done);
  });

  it("[After Opt-out] Should have set BOOMR_CONSENT=\"opted-in\" cookie", function() {
    assert.isTrue(document.cookie.indexOf("BOOMR_CONSENT=\"opted-in\"") !== -1);
  });

  it("[Opt-out before Boomerang loaded] Should not have BOOMR_CONSENT=\"opted-out\" cookie", function() {
    assert.isTrue(document.cookie.indexOf("BOOMR_CONSENT=\"opted-out\"") === -1);
  });

  it("[After Opt-in] Should have sent exactly 2 beacon because these 2 beacons were queued from previous Opt-out", function() {
    assert.equal(tf.beaconCount(), 2);
  });
});
