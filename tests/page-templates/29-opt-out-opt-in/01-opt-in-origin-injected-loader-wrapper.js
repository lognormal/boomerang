/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["BOOMR_CONSENT_CONFIG", "BOOMR_OPT_OUT", "BOOMR_OPT_IN", "BOOMERANG_LOADER_WRAPPER"]);

describe("e2e/29-opt-out-opt-in/01-opt-in-origin-injected-loader-wrapper", function() {
  var snippetStart = window.BOOMR.snippetStart;

  // We need to do this because BOOMR TF is not initialized yet
  var assert = window.chai.assert;

  it("[Before Opt-in] Should not have loaded BOOMR", function() {
    assert.isUndefined(snippetStart);
  });

  BOOMERANG_LOADER_WRAPPER();

  it("[After Opt-in] Should have loaded BOOMR", function() {
    assert.isDefined(window.BOOMR.snippetStart);
  });

  var consentPluginDebug = BOOMR.plugins.ConsentInlinedPlugin.debug;

  it("[After Opt-in] Should not have deferred opt-out state", function() {
    assert.isFalse(consentPluginDebug.getDeferredOptOutFlag());
  });

  it("[After Opt-in] Should not have deferred opt-in state", function() {
    assert.isFalse(consentPluginDebug.getDeferredOptInFlag());
  });
});
