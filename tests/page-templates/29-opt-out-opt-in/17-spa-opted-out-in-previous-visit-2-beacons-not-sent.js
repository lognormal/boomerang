/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["BOOMR_CONSENT_CONFIG", "BOOMR_OPT_OUT", "BOOMR_OPT_IN", "testRunOnce", "eventFired"]);

describe("e2e/29-opt-out-opt-in/17-spa-opted-out-in-previous-visit-2-beacons-not-sent", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should pass Consent Inline Plugin validation", function(done) {
    t.validateConsentInlinePluginState(done);
  });

  it("[After Opt-out] Should have set BOOMR_CONSENT=\"opted-in\" cookie", function() {
    assert.isTrue(document.cookie.indexOf("BOOMR_CONSENT=\"opted-in\"") === -1);
  });

  it("[Opt-out before Boomerang loaded] Should not have BOOMR_CONSENT=\"opted-out\" cookie", function() {
    assert.isTrue(document.cookie.indexOf("BOOMR_CONSENT=\"opted-out\"") !== -1);
  });

  it("[After Opt-in] Should have sent exactly 0 beacons because Opt-out", function() {
    assert.equal(tf.beaconCount(), 0);
  });
});
