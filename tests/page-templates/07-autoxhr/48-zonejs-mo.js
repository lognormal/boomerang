/* eslint-env mocha */
/* global assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, [
  "Zone",
  "__zone_symbol__Promise",
  "__zone_symbol__ZoneAwarePromise",
  "__zone_symbol__setTimeout",
  "__zone_symbol__clearTimeout",
  "__zone_symbol__setInterval",
  "__zone_symbol__clearInterval",
  "__zone_symbol__requestAnimationFrame",
  "__zone_symbol__cancelAnimationFrame",
  "__zone_symbol__webkitRequestAnimationFrame",
  "__zone_symbol__webkitCancelAnimationFrame",
  "__zone_symbol__alert",
  "__zone_symbol__prompt",
  "__zone_symbol__confirm",
  "__zone_symbol__MutationObserver",
  "__zone_symbol__WebKitMutationObserver",
  "__zone_symbol__IntersectionObserver",
  "__zone_symbol__FileReader",
  "__zone_symbol__pagehidefalse",
  "__zone_symbol__pageshowfalse",
  "__zone_symbol__DOMContentLoadedfalse",
  "img",
  "xhr",
  "beaconCount",
  "zoneSpec",
  "Zone1",
  "ZONE_MO_USED",
  "__zone_symbol__ON_PROPERTYerror",
  "__zone_symbol__errorfalse"
]);

describe("e2e/07-autoxhr/48-zonejs-mo", function() {
  var t = BOOMR_test;
  var tf = BOOMR.plugins.TestFramework;

  it("Should get 2 beacons: 1 onload, 1 xhr (XMLHttpRequest !== null)", function(done) {
    this.timeout(10000);
    t.ifAutoXHR(
      done,
      function() {
        t.ensureBeaconCount(done, 2);
      },
      this.skip.bind(this));
  });

  it("Should get 1 beacons: 1 onload (XMLHttpRequest === null)", function(done) {
    this.timeout(10000);
    t.ifAutoXHR(
      done,
      this.skip.bind(this),
      function() {
        t.ensureBeaconCount(done, 1);
      });
  });

  it("Should not have invoked our MutationObserver callback in a zone.js zone", function() {
    if (t.isMutationObserverSupported()) {
      assert.isFalse(window.ZONE_MO_USED);
    }
    else {
      this.skip();
    }
  });

  describe("Beacon 2", function() {
    var i = 1;

    it("Should have a t_done of at least 1400ms based on the duration of the XHR and image being fetched (if MutationObserver is supported)", function(done) {
      // 400ms (XHR) + 1000ms (IMG)
      if (t.isMutationObserverSupported()) {
        t.ifAutoXHR(
          done,
          function() {
            assert.closeTo(tf.beacons[i].t_done, 1400, 300, "t_done was not close to 1400ms");
            done();
          },
          this.skip.bind(this)
        );
      }
      else {
        this.skip();
      }
    });

    it("Should have a t_done of at least 400ms based on the duration of the XHR being fetched (if MutationObserver is not supported)", function(done) {
      if (!t.isMutationObserverSupported()) {
        t.ifAutoXHR(
          done,
          function() {
            assert.closeTo(tf.beacons[i].t_done, 400, 50, "t_done is not close to 400ms");
            done();
          },
          this.skip.bind(this)
        );
      }
      else {
        this.skip();
      }
    });
  });
});
