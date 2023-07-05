/* eslint-env mocha */
/* global assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["t"]);

describe("e2e/07-autoxhr/52-xhr-response-url", function() {
  var t = BOOMR_test;
  var tf = BOOMR.plugins.TestFramework;

  it("Should have sent beacons for each XHR/Fetch call", function(done) {
    t.ifAutoXHR(
      done,
      function() {
        t.ensureBeaconCount(done, t.isFetchApiSupported() ? 5 : 3);
      },
      this.skip.bind(this)
    );
  });

  it("For XHR, beacon parameter 'xhr.ru' should be present, since redirect happened and final url is not equal to the source url", function(done) {
    t.ifAutoXHR(
      done,
      function() {
        var beacon = tf.beacons[1];

        assert.equal(beacon["http.initiator"], "xhr");
        assert.include(beacon.u, "/302?to=/blackhole/test");
        assert.include(beacon["xhr.ru"], "/blackhole/test");
        done();
      },
      this.skip.bind(this)
    );
  });

  it("For XHR, beacon parameter 'xhr.ru' should NOT be present, since there was no redirect", function(done) {
    t.ifAutoXHR(
      done,
      function() {
        var beacon = tf.beacons[2];

        assert.equal(beacon["http.initiator"], "xhr");
        assert.include(beacon.u, "/blackhole");
        assert.isUndefined(beacon["xhr.ru"]);
        done();
      },
      this.skip.bind(this)
    );
  });

  it("For Fetch, beacon parameter 'xhr.ru' should be present, since redirect happened", function(done) {
    if (!t.isFetchApiSupported()) {
      return this.skip();
    }

    t.ifAutoXHR(
      done,
      function() {
        var beacon = tf.beacons[3];

        assert.equal(beacon["http.initiator"], "xhr");
        assert.include(beacon.u, "/302?to=/blackhole/test");
        assert.include(beacon["xhr.ru"], "/blackhole/test");
        done();
      },
      this.skip.bind(this)
    );
  });

  it("For Fetch, beacon parameter 'xhr.ru' should NOT be present, since there was no redirect", function(done) {
    if (!t.isFetchApiSupported()) {
      return this.skip();
    }

    t.ifAutoXHR(
      done,
      function() {
        var beacon = tf.beacons[4];

        assert.equal(beacon["http.initiator"], "xhr");
        assert.include(beacon.u, "/blackhole");
        assert.isUndefined(beacon["xhr.ru"]);
        done();
      },
      this.skip.bind(this)
    );
  });
});
