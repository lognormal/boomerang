/* eslint-env mocha */
// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["angular", "ng339", "modules", "app", "angular_imgs", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2"]);

describe("e2e/05-angular/126-unload-params", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  var UNLOAD_MEMORY_PARAMS = [
    "cpu.cnc",
    "dom.ck",
    "dom.doms",
    "dom.iframe",
    "dom.img",
    "dom.link",
    "dom.ln",
    "dom.res",
    "dom.script.ext",
    "dom.script",
    "dom.sz",
    "mem.limit",
    "mem.lsln",
    "mem.lssz",
    "mem.ssln",
    "mem.sssz",
    "mem.total",
    "mem.used",
    "scr.bpp",
    "scr.dpx",
    "scr.orn",
    "scr.xy "
  ];

  it("Should pass basic beacon validation", function(done) {
    t.validateBeaconWasSent(done);
    clearTimeout(window.timerid);
  });

  it("Should have sent 2 beacons", function() {
    assert.equal(tf.beacons.length, 2);
  });

  describe("Beacon 1", function() {
    it("Should have http.initiator = spa_hard", function() {
      assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
    });

    it("Should have ResourceTiming data (restiming) (if supported)", function() {
      if (!t.isResourceTimingSupported()) {
        this.skip();
      }

      assert.isDefined(tf.beacons[0].restiming);
    });
  });

  describe("Beacon 2", function() {
    it("Should be an Unload beacon (rt.quit)", function() {
      assert.isDefined(tf.beacons[1]["rt.quit"]);
    });

    it("Should not have ResourceTiming data (restiming)", function() {
      if (!t.isResourceTimingSupported()) {
        this.skip();
      }

      assert.isUndefined(tf.beacons[1].restiming);
    });

    it("Should not have Memory data", function() {
      for (var i = 0; i < UNLOAD_MEMORY_PARAMS.length; i++) {
        assert.isUndefined(tf.beacons[1][UNLOAD_MEMORY_PARAMS[i]],
          UNLOAD_MEMORY_PARAMS[i] + " should not be on the beacon");
      }
    });
  });
});
