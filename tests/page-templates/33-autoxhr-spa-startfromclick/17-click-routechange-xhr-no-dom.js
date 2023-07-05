/* eslint-env mocha */
/* global BOOMR,BOOMR_test,describe,it */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["eventFired", "i"]);

describe("e2e/33-autoxhr-spa-startfromclick/17-click-routechange-xhr-no-dom.js", function() {
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

    it("Should have Page Load Time ~2060ms", function() {
      assert.closeTo(tf.beacons[1].t_done, t.xhrTimes.xhr1.duration + 30 + 30, 100);
    });

    it("Should have Page Load Time >= 2060ms", function() {
      assert.operator(tf.beacons[1].t_done, ">=", 2060);
    });

    it("Should have Back End Time ~2000ms", function() {
      assert.closeTo(tf.beacons[1].t_resp, t.xhrTimes.xhr1.duration, 100);
    });

    it("Should have Front End Time >60ms", function() {
      assert.operator(tf.beacons[1].t_page, ">=", 30 + 30);
    });

    it("Should have Front End Time <= 150ms", function() {
      assert.operator(tf.beacons[1].t_page, "<=", 150);
    });
  });
});
