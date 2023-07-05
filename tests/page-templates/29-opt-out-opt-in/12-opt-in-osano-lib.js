/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["cookieconsent", "onCookieConsentChange", "BOOMR_CONSENT_CONFIG", "clickEvent", "BOOMR_OPT_OUT", "BOOMR_OPT_IN"]);

describe("e2e/29-opt-out-opt-in/12-opt-in-osano-lib", function() {
  var t = BOOMR_test;

  it("Should pass Consent Inline Plugin validation", function(done) {
    t.validateConsentInlinePluginState(done);
  });

  it("[After Opt-out] Should not have set RT cookie", function() {
    assert.isTrue(document.cookie.indexOf("RT=") !== -1);
  });

  it("[After Opt-out] Should have set BOOMR_CONSENT=\"opted-in\" cookie", function() {
    assert.isTrue(document.cookie.indexOf("BOOMR_CONSENT=\"opted-in\"") !== -1);
  });
});
