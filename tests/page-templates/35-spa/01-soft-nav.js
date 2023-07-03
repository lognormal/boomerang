/* eslint-env mocha */
/* global BOOMR,BOOMR_test,describe,it */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["$", "jQuery", "imgSize", "imgLatest", "getLcpPoEntry"]);

describe("e2e/35-spa/01-soft-nav.js", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should pass basic beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have sent 4 beacons (window.history !== null)", function(done) {
    this.timeout(10000);

    if (!window.history) {
      return this.skip();
    }

    t.ensureBeaconCount(done, 4);
  });

  describe("Beacon 1", function() {
    it("Should have http.initiator = spa_hard", function() {
      assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
    });

    it("Should not have spa.snh.s", function() {
      assert.isUndefined(tf.beacons[0]["spa.snh.s"]);
    });

    it("Should not have spa.snh.n", function() {
      assert.isUndefined(tf.beacons[0]["spa.snh.n"]);
    });

    it("Should have set pt.lcp (if LargestContentfulPaint is supported and happened by load)", function(done) {
      var observerWait,
          that = this;

      if (!t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      var observer = new t.origPerformanceObserver(function(list) {
        clearTimeout(observerWait);

        var entries = list.getEntries();

        if (entries.length === 0) {
          return that.skip();
        }

        var lcp = entries[entries.length - 1];
        var lcpTime = lcp.renderTime || lcp.loadTime;

        // validation of First Paint
        assert.isNumber(tf.beacons[0]["pt.lcp"]);
        assert.operator(parseInt(tf.beacons[0]["pt.lcp"], 10), ">=", 0);

        observer.disconnect();

        done();
      });

      observer.observe({ type: "largest-contentful-paint", buffered: true });

      // wait for the LCP observer to fire, if not, skip the test
      observerWait = setTimeout(function() {
        // no LCP before load
        return this.skip();
      }.bind(this), 10000);
    });
  });

  describe("Beacon 2", function() {
    it("Should have http.initiator = spa", function() {
      assert.equal(tf.beacons[1]["http.initiator"], "spa");
    });

    it("Should have spa.snh.s", function() {
      if (!t.isSoftNavHeuristicsSupported()) {
        return this.skip();
      }

      assert.isDefined(tf.beacons[1]["spa.snh.s"]);
    });

    it("Should have spa.snh.n", function() {
      if (!t.isSoftNavHeuristicsSupported()) {
        return this.skip();
      }

      assert.isDefined(tf.beacons[1]["spa.snh.n"]);
    });

    it("Should have spa.snh.n=1", function() {
      if (!t.isSoftNavHeuristicsSupported()) {
        return this.skip();
      }

      assert.equal(tf.beacons[1]["spa.snh.n"], "1");
    });

    it("Should have pt.lcp", function() {
      if (!t.isSoftNavHeuristicsSupported() ||
          !t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.isDefined(tf.beacons[1]["pt.lcp"]);
    });

    it("Should have pt.lcp >= 1", function() {
      if (!t.isSoftNavHeuristicsSupported() ||
          !t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.operator(parseInt(tf.beacons[1]["pt.lcp"], 10), ">=", 1);
    });

    it("Should have pt.lcp.src", function() {
      if (!t.isSoftNavHeuristicsSupported()) {
        return this.skip();
      }

      assert.isDefined(tf.beacons[1]["pt.lcp.src"]);
      assert.include(tf.beacons[1]["pt.lcp.src"], "nav1");
    });
  });

  describe("Beacon 3", function() {
    it("Should have http.initiator = spa", function() {
      assert.equal(tf.beacons[2]["http.initiator"], "spa");
    });

    it("Should have spa.snh.s", function() {
      if (!t.isSoftNavHeuristicsSupported()) {
        return this.skip();
      }

      assert.isDefined(tf.beacons[2]["spa.snh.s"]);
    });

    it("Should have spa.snh.n", function() {
      if (!t.isSoftNavHeuristicsSupported()) {
        return this.skip();
      }

      assert.isDefined(tf.beacons[2]["spa.snh.n"]);
    });

    it("Should have spa.snh.n=4", function() {
      if (!t.isSoftNavHeuristicsSupported()) {
        return this.skip();
      }

      assert.equal(tf.beacons[2]["spa.snh.n"], "4");
    });

    it("Should have pt.lcp", function() {
      if (!t.isSoftNavHeuristicsSupported() ||
          !t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.isDefined(tf.beacons[2]["pt.lcp"]);
    });

    it("Should have pt.lcp >= 1000", function() {
      if (!t.isSoftNavHeuristicsSupported() ||
          !t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.operator(parseInt(tf.beacons[2]["pt.lcp"], 10), ">=", 1000);
    });

    it("Should have pt.lcp.src", function() {
      if (!t.isSoftNavHeuristicsSupported() ||
          !t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.isDefined(tf.beacons[2]["pt.lcp.src"]);
      assert.include(tf.beacons[2]["pt.lcp.src"], "nav2");
    });
  });

  describe("Beacon 4", function() {
    it("Should have http.initiator = spa", function() {
      assert.equal(tf.beacons[3]["http.initiator"], "spa");
    });

    it("Should have spa.snh.s", function() {
      if (!t.isSoftNavHeuristicsSupported()) {
        return this.skip();
      }

      assert.isDefined(tf.beacons[3]["spa.snh.s"]);
    });

    it("Should have spa.snh.n", function() {
      if (!t.isSoftNavHeuristicsSupported()) {
        return this.skip();
      }

      assert.isDefined(tf.beacons[3]["spa.snh.n"]);
    });

    it("Should have spa.snh.n=1", function() {
      if (!t.isSoftNavHeuristicsSupported()) {
        return this.skip();
      }

      assert.equal(tf.beacons[3]["spa.snh.n"], "1");
    });

    it("Should have pt.lcp", function() {
      if (!t.isSoftNavHeuristicsSupported() ||
          !t.isLargestContentfulPaintSupported()) {
        return this.skip();
      }

      assert.isDefined(tf.beacons[3]["pt.lcp"]);
    });
  });
});
