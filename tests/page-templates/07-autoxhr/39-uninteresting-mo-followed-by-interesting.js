/* eslint-env mocha */
/* global assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["createXHREvent"]);

describe("e2e/07-autoxhr/39-uninteresting-mo-followed-by-interesting", function() {
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

  it("Should have the first beacon be a page load beacon (XMLHttpRequest !== null)", function(done) {
    t.ifAutoXHR(
      done,
      function() {
        assert.include(tf.beacons[0].u, "39-uninteresting-mo-followed-by-interesting.html");
        done();
      });
  });

  describe("Beacon 2 (xhr)", function() {
    var i = 1;

    it("Should be a XHR beacon (XMLHttpRequest !== null)", function(done) {
      t.ifAutoXHR(
        done,
        function() {
          assert.equal(tf.beacons[i]["http.initiator"], "xhr");
          done();
        },
        this.skip.bind(this));
    });

    it("Should have the URL of the XHR (XMLHttpRequest !== null)", function(done) {
      t.ifAutoXHR(
        done,
        function() {
          assert.include(tf.beacons[i].u, "blank.html");
          done();
        },
        this.skip.bind(this));
    });

    it("Should  have a t_done time that includes the image download", function(done) {
      if (t.isMutationObserverSupported()) {
        t.ifAutoXHR(
          done,
          function() {
            var b = tf.beacons[i];

            assert.closeTo(b.t_done, 1650, 150);  // 1500-1800 : 500ms timer delay + 1000ms image delay
            done();
          },
          this.skip.bind(this));
      }
      else {
        this.skip();
      }
    });
  });

  describe("Beacon 3 (xhr)", function() {
    var i = 2;

    it("Should be a XHR beacon (XMLHttpRequest !== null)", function(done) {
      t.ifAutoXHR(
        done,
        function() {
          assert.equal(tf.beacons[i]["http.initiator"], "xhr");
          done();
        },
        this.skip.bind(this));
    });

    it("Should have the URL of the XHR (XMLHttpRequest !== null)", function(done) {
      t.ifAutoXHR(
        done,
        function() {
          assert.include(tf.beacons[i].u, "blank.html");
          done();
        },
        this.skip.bind(this));
    });

    it("Should  have a t_done time that includes the image download", function(done) {
      if (t.isMutationObserverSupported()) {
        t.ifAutoXHR(
          done,
          function() {
            var b = tf.beacons[i];

            assert.closeTo(b.t_done, 1650, 150);  // 1500-1800 : 500ms timer delay + 1000ms image delay
            done();
          },
          this.skip.bind(this));
      }
      else {
        this.skip();
      }
    });
  });
});
