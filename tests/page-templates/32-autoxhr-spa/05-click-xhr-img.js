/* eslint-env mocha */
/* global BOOMR,BOOMR_test,describe,it */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["eventFired"]);

describe("e2e/32-autoxhr-spa/05-click-xhr-img.js", function() {
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
    it("Should have http.initiator = xhr", function() {
      assert.equal(tf.beacons[1]["http.initiator"], "xhr");
    });

    it("Should have URL with xhr1", function() {
      assert.include(tf.beacons[1].u, "xhr1");
    });

    it("Should have rt.tstart around the time of the XHR", function() {
      assert.closeTo(tf.beacons[1]["rt.tstart"], t.xhrTimes.xhr1.start, 10);
    });

    it("Should have Page Load Time ~4000ms", function() {
      assert.closeTo(tf.beacons[1].t_done, t.xhrTimes.xhr1.duration + t.imgTimes.img1.duration, 100);
    });

    it("Should have Page Load Time >= 4000ms", function() {
      assert.operator(tf.beacons[1].t_done, ">=", 4000);
    });

    it("Should have Back End Time ~2000ms", function() {
      assert.closeTo(tf.beacons[1].t_resp, t.xhrTimes.xhr1.duration, 100);
    });

    it("Should have Front End Time ~2000ms", function() {
      assert.closeTo(tf.beacons[1].t_page, t.imgTimes.img1.duration, 100);
    });
  });
});
