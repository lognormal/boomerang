/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["clsSourcesOnBeaconSend", "clsSources", "topIDOnBeaconSend", "topID", "topScore", "observer", "onBeforeBeaconSend"]);

describe("e2e/21-continuity/43-cls-sources", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  // We would like to skip testing for browsers that do not support CLS.
  var isClsSupported = t.isCLSSupported();

  it("Should have sent a beacon", function() {
    // ensure we fired a beacon ('beacon')
    assert.isTrue(tf.fired_onbeacon);
  });

  it("Should have set c.cls.d (if PerformanceObserver is supported)", function(done) {
    if (!isClsSupported) {
      return this.skip();
    }

    var clsSources = BOOMR.plugins.Continuity.decompressClsSources(tf.lastBeacon()["c.cls.d"]);

    assert(Array.isArray(clsSources));

    for (var entry = 0; entry < clsSources.length; entry++) {
      assert.deepEqual(Object.keys(clsSources[entry]), Object.keys(clsSourcesOnBeaconSend[entry]));

      assert.isNumber(clsSources[entry].value);
      assert(clsSources[entry].value < 1);

      assert.isNumber(clsSources[entry].startTime);

      var sourceList = clsSources[entry].sources;

      assert.isArray(sourceList);

      for (var source = 0; source < sourceList.length; source++) {
        assert.deepEqual(Object.keys(sourceList[source]), Object.keys(clsSourcesOnBeaconSend[entry].sources[source]));
        assert.isString(sourceList[source].selector);
        assert.isObject(sourceList[source].previousRect);
        assert.isObject(sourceList[source].currentRect);

        assert.strictEqual(sourceList[source].selector, clsSourcesOnBeaconSend[entry].sources[source].selector);
        assert.deepEqual(sourceList[source].previousRect, clsSourcesOnBeaconSend[entry].sources[source].previousRect);
        assert.deepEqual(sourceList[source].currentRect, clsSourcesOnBeaconSend[entry].sources[source].currentRect);
      }

      assert.equal(clsSources[entry].value, clsSourcesOnBeaconSend[entry].value);
      assert.equal(clsSources[entry].startTime, clsSourcesOnBeaconSend[entry].startTime);
      assert.deepEqual(clsSources[entry].sources, clsSourcesOnBeaconSend[entry].sources);
    }

    done();
  });

  it("Should have set c.cls.topid (if PerformanceObserver is supported)", function(done) {
    if (!isClsSupported) {
      return this.skip();
    }

    assert.isString(tf.lastBeacon()["c.cls.topid"]);
    assert.strictEqual(tf.lastBeacon()["c.cls.topid"], topIDOnBeaconSend);
    done();
  });
});
