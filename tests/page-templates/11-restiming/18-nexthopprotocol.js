/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["ResourceTimingDecompression"]);

describe("e2e/11-restiming/18-nexthopprotocol", function() {
  var t = BOOMR_test;
  var tf = BOOMR.plugins.TestFramework;

  var beaconData;

  it("Should have captured nextHopProtocol on each resource", function() {
    if (t.isResourceTimingSupported()) {
      var b = tf.beacons[0];

      ResourceTimingDecompression.HOSTNAMES_REVERSED = false;
      var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

      for (var i = 0; i < resources.length; i++) {
        // find this JavaScript from ResourceTiming
        var resourceTimingResource = t.findFirstResource(resources[i].name);

        if (resourceTimingResource === null) {
          resourceTimingResource = performance.getEntriesByType("navigation")[0];
        }

        if (!resources[i].nextHopProtocol) {
          return;
        }

        assert.isNotNull(resourceTimingResource);

        assert.equal(
          resourceTimingResource.nextHopProtocol,
          resources[i].nextHopProtocol,
          resources[i].name + " should have protocol " + resources[i].nextHopProtocol);
      }
    }
    else {
      this.skip();
    }
  });
});
