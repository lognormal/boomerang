/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["localUA"]);

describe("e2e/00-basic/20-entropy-client-hints-false", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a beacon", function() {
    // ensure we fired a beacon ('beacon')
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should NOT have set properties architecture, model, and platformVersion", function() {
    assert.isUndefined(tf.lastBeacon()["ua.arch"]);
    assert.isUndefined(tf.lastBeacon()["ua.model"]);
    assert.isUndefined(tf.lastBeacon()["ua.pltv"]);
  });
});
