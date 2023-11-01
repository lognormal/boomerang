/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["LargestContentfulPaint", "generateLCP"]);

describe("e2e/20-painttiming/09-prerendered", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a beacon", function() {
    // ensure we fired a beacon ('beacon')
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should have set pt.fp on the beacon and offset by the activationStart", function() {
    if (!t.isPaintTimingSupported() || !t.isPrerenderingSupported()) {
      return this.skip();
    }

    var fp = parseInt(tf.lastBeacon()["pt.fp"], 10);

    assert.operator(fp, "<", BOOMR_test.ACT_ST_OFFSET);
    assert.operator(fp, ">=", 0);
  });

  it("Should have set pt.fcp on the beacon and offset by the activationStart", function() {
    if (!t.isPaintTimingSupported() || !t.isPrerenderingSupported()) {
      return this.skip();
    }

    var fcp = parseInt(tf.lastBeacon()["pt.fcp"], 10);

    assert.operator(fcp, "<", BOOMR_test.ACT_ST_OFFSET);
    assert.operator(fcp, ">=", 0);
  });

  it("Should have set pt.lcp on the beacon and offset by the activationStart", function() {
    if (!t.isPaintTimingSupported() ||
        !t.isLargestContentfulPaintSupported() ||
        !t.isPrerenderingSupported()) {
      return this.skip();
    }

    var lcp = parseInt(tf.lastBeacon()["pt.lcp"], 10);

    assert.operator(lcp, "<", BOOMR_test.ACT_ST_OFFSET);
    assert.operator(lcp, ">=", 0);
  });
});
