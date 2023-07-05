/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["BOOMR_CONSENT_CONFIG", "BOOMR_OPT_OUT", "BOOMR_OPT_IN", "testRunOnce", "eventFired"]);

describe("e2e/29-opt-out-opt-in/18-spa-opt-out-after-previous-opt-in", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should pass Consent Inline Plugin validation", function(done) {
    t.validateConsentInlinePluginState(done);
  });

  it("[After Opt-out] Should have set BOOMR_CONSENT=\"opted-out\" cookie", function() {
    assert.isTrue(document.cookie.indexOf("BOOMR_CONSENT=\"opted-out\"") !== -1);
  });

  it("[Opt-out before Boomerang loaded] Should not have BOOMR_CONSENT=\"opted-in\" cookie", function() {
    assert.isTrue(document.cookie.indexOf("BOOMR_CONSENT=\"opted-in\"") === -1);
  });

  it("[After Opt-out] Should have sent exactly 1 beacon because the rest were blocked because of Opt-out", function() {
    assert.equal(tf.beaconCount(), 1);
  });
});
