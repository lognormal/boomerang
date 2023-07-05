/* eslint-env mocha */
/* global assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["xhr"]);

describe("e2e/07-autoxhr/52-alwayssendxhr", function() {
  var t = BOOMR_test;
  var tf = BOOMR.plugins.TestFramework;

  it("Should get 3 beacons: 1 onload, 2 xhr (XMLHttpRequest !== null)", function(done) {
    this.timeout(10000);

    t.ifAutoXHR(
      done,
      function() {
        t.ensureBeaconCount(done, 3);
      });
  });

  describe("Beacon 1 (onload)", function() {
    var i = 0;

    it("Should be a page load beacon", function() {
      var b = tf.beacons[i];

      assert.isUndefined(b["http.initiator"]);
    });

    it("Should have the URL of the page", function() {
      var b = tf.beacons[i];

      assert.include(b.u, "52-alwayssendxhr.html");
    });
  });

  describe("Beacon 1 (XHR due to alwaysSendXhr)", function() {
    var i = 1;

    it("Should be a XHR beacon", function() {
      var b = tf.beacons[i];

      assert.equal(b["http.initiator"], "xhr");
    });

    it("Should have the URL of ?always", function() {
      var b = tf.beacons[i];

      assert.include(b.u, "?always");
    });
  });

  describe("Beacon 2 (XHR due to DOM mutation)", function() {
    var i = 2;

    it("Should be a XHR beacon", function() {
      var b = tf.beacons[i];

      assert.equal(b["http.initiator"], "xhr");
    });

    it("Should have the URL of ?not-always-with-dom", function() {
      var b = tf.beacons[i];

      assert.include(b.u, "?not-always-with-dom");
    });
  });
});
