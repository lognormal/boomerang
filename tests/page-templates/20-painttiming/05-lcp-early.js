/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["LargestContentfulPaint", "POs", "curLoadTime", "generateLCP"]);

describe("e2e/20-painttiming/05-lcp-early", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;
  var C = BOOMR.utils.Compression;

  it("Should have sent two beacons", function(done) {
    this.timeout(10000);
    t.ensureBeaconCount(done, 2);
  });

  describe("Beacon 1: Early Beacon", function() {
    it("Should have sent an early beacon", function(){
      assert.operator(parseInt(tf.beacons[0].early, 10), ">", 0);
    });

    it("Should have LCP data on the early beacon", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      var earlyBeacon = tf.beacons[0];

      assert.isNumber(earlyBeacon["pt.lcp"]);
      assert.operator(parseInt(tf.lastBeacon()["pt.lcp"], 10), ">", 0);
    });
  });

  describe("Beacon 2: Pageload Beacon", function(){
    it("Should have set pt.lcp (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.isNumber(tf.lastBeacon()["pt.lcp"]);
      assert.operator(parseInt(tf.lastBeacon()["pt.lcp"], 10), ">=", 0);
      assert.equal(tf.lastBeacon()["pt.lcp"], 220);
    });

    it("Should have exposed LCP metric (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.equal(tf.lastBeacon()["pt.lcp"], BOOMR.plugins.PaintTiming.metrics.lcp());
    });

    it("Should have exposed LCP metric src (pt.lcp.src) (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.equal(tf.lastBeacon()["pt.lcp"], BOOMR.plugins.PaintTiming.metrics.lcp());

      assert.isString(tf.lastBeacon()["pt.lcp.src"]);

      assert.equal(tf.lastBeacon()["pt.lcp.src"], BOOMR.plugins.PaintTiming.metrics.lcpSrc());
      assert.include(tf.lastBeacon()["pt.lcp.src"], "delay?delay=2000&file=/assets/img.jpg&id=2000");
    });

    it("Should have exposed LCP metric element (pt.lcp.el) (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.isString(tf.lastBeacon()["pt.lcp.el"]);

      assert.equal(tf.lastBeacon()["pt.lcp.el"], BOOMR.plugins.PaintTiming.metrics.lcpEl());
      assert.equal(tf.lastBeacon()["pt.lcp.el"], "IMG");
    });

    it("Should have exposed LCP metric ID (pt.lcp.id) (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.equal(tf.lastBeacon()["pt.lcp.id"], "img_id2");
    });

    it("Should have exposed LCP metric Pseudo-CSS Selector (pt.lcp.e) (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.isString(tf.lastBeacon()["pt.lcp.e"]);

      assert.equal(tf.lastBeacon()["pt.lcp.e"], BOOMR.plugins.PaintTiming.metrics.lcpE());
      assert.equal(tf.lastBeacon()["pt.lcp.e"], "img#img_id2");
    });

    it("Should not have exposed LCP metric src-set (pt.lcp.srcset) (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.notProperty(tf.lastBeacon(), "pt.lcp.srcset");
    });

    it("Should not have exposed LCP metric sizes (pt.lcp.sizes) (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.notProperty(tf.lastBeacon(), "pt.lcp.sizes");
    });

    it("Should have exposed LCP metric size (pt.lcp.s) (if LargestContentfulPaint is supported and happened by load)", function() {
      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.isTrue(Number.isInteger(tf.lastBeacon()["pt.lcp.s"]));

      assert.equal(tf.lastBeacon()["pt.lcp.s"], BOOMR.plugins.PaintTiming.metrics.lcpS());
    });
  });
});
