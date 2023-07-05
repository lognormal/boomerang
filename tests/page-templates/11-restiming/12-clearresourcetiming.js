/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["ResourceTimingDecompression"]);

describe("e2e/11-restiming/12-clearresourcetiming", function() {
  var t = BOOMR_test;
  var tf = BOOMR.plugins.TestFramework;

  it("Should pass basic beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should find both scripts", function() {
    if (!t.isResourceTimingSupported()) {
      return this.skip();
    }

    var b = tf.lastBeacon();
    var entries = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

    BOOMR.utils.forEach(["one.js", "two.js"], function(file) {
      assert.isDefined(BOOMR.utils.arrayFind(entries, function(e){
        return e.name.indexOf(file) > -1;
      }), "can't find: " + file);
    });
  });
});
