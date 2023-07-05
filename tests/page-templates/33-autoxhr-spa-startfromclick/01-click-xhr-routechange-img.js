/* eslint-env mocha */
/* global BOOMR,BOOMR_test,describe,it */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["spaInitTiming", "spaNavigationTiming", "eventFired", "i"]);

describe("e2e/33-autoxhr-spa-startfromclick/01-click-xhr-routechange-img.js", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should pass basic beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should have sent 2 beacons (XMLHttpRequest !== null)", function(done) {
    this.timeout(10000);

    t.ifAutoXHR(
      done,
      function() {
        t.ensureBeaconCount(done, 2);
      },
      this.skip.bind(this));
  });

  describe("Beacon 1", function() {
    it("Should have http.initiator = spa_hard", function() {
      assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
    });
  });

  describe("Beacon 2", function() {
    it("Should have http.initiator = spa", function() {
      assert.equal(tf.beacons[1]["http.initiator"], "spa");
    });

    it("Should have URL with #newstate", function() {
      assert.include(tf.beacons[1].u, "#newstate");
    });

    it("Should have rt.tstart around the time of the click", function() {
      assert.closeTo(tf.beacons[1]["rt.tstart"], t.mouseEventTimes[0], 100);
    });

    it("Should have Page Load Time ~4040ms", function() {
      assert.closeTo(tf.beacons[1].t_done, t.xhrTimes.xhr1.duration + t.imgTimes.img1.duration + 30 + 10, 100);
    });

    it("Should have Page Load Time >= 4040ms", function() {
      assert.operator(tf.beacons[1].t_done, ">=", 4040);
    });

    it("Should have Back End Time ~2000ms", function() {
      assert.closeTo(tf.beacons[1].t_resp, t.xhrTimes.xhr1.duration, 100);
    });

    it("Should have Front End Time ~2040ms", function() {
      assert.closeTo(tf.beacons[1].t_page, t.imgTimes.img1.duration + 30 + 10, 100);
    });
  });

  describe("event spa_init", function() {
    it("Should have sent the timing in the callback", function() {
      assert.isDefined(window.spaInitTiming);

      assert.equal(tf.beacons[1]["rt.tstart"], window.spaInitTiming.requestStart);
    });
  });

  describe("event spa_navigation", function() {
    it("Should have sent the timing in the callback", function() {
      assert.isDefined(window.spaNavigationTiming);

      assert.equal(tf.beacons[1].t_done, window.spaNavigationTiming.loadEventEnd - window.spaNavigationTiming.requestStart);
    });
  });
});
