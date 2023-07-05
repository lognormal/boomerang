/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["clsScoreOnBeaconSend", "clsScore", "topScoreOnBeaconSend", "topScore", "observer", "onBeforeBeaconSend"]);

describe("e2e/21-continuity/36-cls", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent a beacon", function() {
    // ensure we fired a beacon ('beacon')
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should have set c.cls (if PerformanceObserver is supported)", function(done) {
    if (!typeof BOOMR.window.PerformanceObserver === "function" || !BOOMR.window.LayoutShift) {
      return this.skip();
    }

    var clsScore = BOOMR.plugins.Continuity.decompressClsScore(tf.lastBeacon()["c.cls"]);

    assert.isNumber(clsScore);
    assert.equal(clsScore, parseFloat(clsScoreOnBeaconSend.toFixed(3)));

    done();
  });

  it("Should have set c.cls.tops (if PerformanceObserver is supported)", function(done) {
    if (!typeof BOOMR.window.PerformanceObserver === "function" || !BOOMR.window.LayoutShift) {
      return this.skip();
    }

    var topScore = BOOMR.plugins.Continuity.decompressClsScore(tf.lastBeacon()["c.cls.tops"]);

    assert.isNumber(topScore);
    assert.equal(topScore, topScoreOnBeaconSend);

    done();
  });
});
