/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["BOOMR_CONSENT_CONFIG", "BOOMR_OPT_OUT", "BOOMR_OPT_IN"]);

describe("e2e/29-opt-out-opt-in/04-opt-in-after-page-ready", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;
  var consentPluginDebug = BOOMR.plugins.ConsentInlinedPlugin.debug;

  before("Give enough time to Boomerang to check if all plugins are ready", function(done) {
    this.timeout(2500);
    setTimeout(done, 2000);
  });

  it("Should pass Consent Inline Plugin validation", function(done) {
    t.validateConsentInlinePluginState(done);
  });

  it("[After Opt-in] Should have at least one beacon sent", function() {
    assert.isTrue(tf.beaconCount() >= 1);
  });

  it("[After Opt-in] Should not have deferred opt-out state", function() {
    assert.isFalse(consentPluginDebug.getDeferredOptOutFlag());
  });

  it("[After Opt-in] Should not have deferred opt-in state", function() {
    assert.isFalse(consentPluginDebug.getDeferredOptInFlag());
  });
});
