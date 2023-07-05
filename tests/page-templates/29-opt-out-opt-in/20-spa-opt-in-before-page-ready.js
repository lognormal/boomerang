/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["BOOMR_CONSENT_CONFIG", "BOOMR_OPT_OUT", "BOOMR_OPT_IN", "testRunOnce", "eventFired", "i"]);

describe("e2e/29-opt-out-opt-in/20-spa-opt-in-before-page-ready", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should pass Consent Inline Plugin validation", function(done) {
    t.validateConsentInlinePluginState(done);
  });

  it("[After Opt-in] Should not have set BOOMR_CONSENT=\"opted-out\" cookie", function() {
    assert.isTrue(document.cookie.indexOf("BOOMR_CONSENT=\"opted-out\"") === -1);
  });

  it("[Opt-in before Boomerang loaded] Should have BOOMR_CONSENT=\"opted-in\" cookie", function() {
    assert.isTrue(document.cookie.indexOf("BOOMR_CONSENT=\"opted-in\"") !== -1);
  });

  it("[After Opt-in] Should have sent exactly 2 beacons because Opt-in before Boomerang was loaded.", function() {
    assert.equal(tf.beaconCount(), 2);
  });
});
