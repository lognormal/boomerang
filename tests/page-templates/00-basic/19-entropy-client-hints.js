/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["localUA"]);

describe("e2e/00-basic/19-entropy-client-hints", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a beacon", function() {
    // ensure we fired a beacon ('beacon')
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should have set properties architecture, model, and platformVersion", function() {
    var arch = tf.lastBeacon()["ua.arch"];

    assert.isString(arch);
    assert.equal(arch, "test_arch");

    var model = tf.lastBeacon()["ua.model"];

    assert.isString(model);
    assert.equal(model, "test_model");

    var pltv = tf.lastBeacon()["ua.pltv"];

    assert.isString(pltv);
    assert.equal(pltv, "test_plat_v");
  });
});
