/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["ResourceTimingDecompression"]);

describe("e2e/06-bug/issue-606", function() {
  var t = BOOMR_test;
  var tf = BOOMR.plugins.TestFramework;

  it("Should pass basic beacon validation", function(done) {
    t.validateBeaconWasSent(done);
  });

  it("Should only have one iframe and one CSS in the filter (if ResourceTiming is supported)", function() {
    if (t.isResourceTimingSupported()) {
      var b = tf.lastBeacon();

      var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

      assert.equal(resources.length, 2);

      var frameIndex = resources[0].initiatorType === "frame" ? 0 : 1;
      var cssIndex = frameIndex === 0 ? 1 : 0;

      // find our iframe
      assert.equal(resources[frameIndex].initiatorType, "frame");
      assert.include(resources[frameIndex].name, "support/92542-iframe.html");

      // find our css
      assert.equal(resources[cssIndex].initiatorType, "css");
      assert.include(resources[cssIndex].name, "support/img.jpg");
    }
  });
});
