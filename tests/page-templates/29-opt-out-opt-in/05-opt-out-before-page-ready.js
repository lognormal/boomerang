/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["BOOMR_CONSENT_CONFIG", "BOOMR_OPT_OUT", "BOOMR_OPT_IN"]);

describe("e2e/29-opt-out-opt-in/06-opt-out-before-page-ready", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;
  var consentPluginDebug = BOOMR.plugins.ConsentInlinedPlugin.debug;

  it("Should pass Consent Inline Plugin validation", function(done) {
    t.validateConsentInlinePluginState(done);
  });

  it("[Opt-out before Boomerang loaded] Should have 0 beacons sent", function() {
    assert.isTrue(tf.beaconCount() === 0);
  });

  it("[Opt-out before Boomerang loaded] Should have set BOOMR_CONSENT=\"opted-out\" cookie", function() {
    assert.isTrue(document.cookie.indexOf("BOOMR_CONSENT=\"opted-out\"") !== -1);
  });

  it("[Opt-out before Boomerang loaded] Should not have BOOMR_CONSENT=\"opted-in\" cookie", function() {
    assert.isTrue(document.cookie.indexOf("BOOMR_CONSENT=\"opted-in\"") === -1);
  });

  it("[After Opt-in] Should not have deferred opt-out state", function() {
    assert.isFalse(consentPluginDebug.getDeferredOptOutFlag());
  });

  it("[After Opt-in] Should not have deferred opt-in state", function() {
    assert.isFalse(consentPluginDebug.getDeferredOptInFlag());
  });
});
