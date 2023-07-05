/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["BOOMR_CONSENT_CONFIG", "BOOMR_OPT_OUT", "BOOMR_OPT_IN"]);

describe("e2e/29-opt-out-opt-in/02-opt-out-custom-rt-cookie", function() {
  var t = BOOMR_test;

  it("Should pass Consent Inline Plugin validation", function(done) {
    t.validateConsentInlinePluginState(done);
  });

  it("[After Opt-out] Should not have CUSTOM RT cookie", function() {
    assert.isFalse(document.cookie.indexOf("CUSTOM=") !== -1);
  });

  it("[After Opt-out] Should not have set RT cookie", function() {
    assert.isFalse(document.cookie.indexOf("RT=") !== -1);
  });

  it("[After Opt-out] Should have set BOOMR_CONSENT=\"opted-out\" cookie", function() {
    assert.isTrue(document.cookie.indexOf("BOOMR_CONSENT=\"opted-out\"") !== -1);
  });
});
