/* eslint-env mocha */
/* global chai */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["lastNav"]);

describe("e2e/28-rt/02-keep-beacon-url-on-load", function() {
  var assert = chai.assert;
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  it("Should have sent one beacon", function(done) {
    t.ensureBeaconCount(done, 1);
  });

  it("Should have kept the original beacon_url", function() {
    assert.equal(BOOMR.getBeaconURL(), "/beacon");
  });
});
