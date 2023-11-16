/* eslint-env mocha */
/* global BOOMR_test,assert */

describe("e2e/21-continuity/44-zero-cls", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  // We would like to skip testing for browsers that do not support CLS.
  var isClsSupported = t.isCLSSupported();

  it("Should have sent a beacon", function() {
    // ensure we fired a beacon ('beacon')
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should have set c.cls of 0", function() {
    if (!isClsSupported) {
      this.skip();
    }

    assert.equal(tf.lastBeacon()["c.cls"], 0);
  });

  it("Should not have set c.cls.topid", function() {
    if (!isClsSupported) {
      this.skip();
    }

    assert.isUndefined(tf.lastBeacon()["c.cls.topid"]);
  });

  it("Should not have set c.cls.d", function() {
    if (!isClsSupported) {
      this.skip();
    }

    assert.isUndefined(tf.lastBeacon()["c.cls.d"]);
  });
});

