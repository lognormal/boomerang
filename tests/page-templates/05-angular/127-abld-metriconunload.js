/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["angular", "ng339", "ResourceTimingDecompression", "angular_imgs", "angular_html5_mode", "modules", "app", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "nav1time", "nav2time", "i"]);

describe("e2e/05-angular/127-abld-metriconunload", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should pass basic beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have sent three beacons", function() {
    assert.equal(tf.beacons.length, 3);
  });

  it("Should have sent the first beacon with rt.quit and rt.abld (if MutationObserver and NavigationTiming are supported)", function() {
    if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
      var b = tf.beacons[0];

      assert.equal(b["rt.quit"], "");
      assert.equal(b["rt.abld"], "");
    }
  });

  it("Should have DOM count data on unload, as the onNonPageLoad is set", function() {
    var b = tf.beacons[0];

    assert.isDefined(b["dom.ln"]);
    assert.isDefined(b["dom.img"]);
    assert.isDefined(b["dom.script"]);
    assert.isDefined(b["dom.iframe"]);
    assert.isDefined(b["dom.link"]);
  });

  it("Should have ResourceTiming data (restiming) (if supported)", function() {
    if (!t.isResourceTimingSupported()) {
      this.skip();
    }

    var b = tf.beacons[0];

    assert.isDefined(b.restiming);
  });
});
