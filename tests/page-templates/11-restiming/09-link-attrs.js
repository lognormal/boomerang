/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["ResourceTimingDecompression"]);

describe("e2e/11-restiming/09-link-attrs", function() {
  var t = BOOMR_test;
  var tf = BOOMR.plugins.TestFramework;

  function assertLinkRel(data, expectedRel) {
    var RT = BOOMR.plugins.ResourceTiming;
    var LINK_ATTR_EXPR = new RegExp("^.*\\" + RT.SPECIAL_DATA_PREFIX + RT.SPECIAL_DATA_LINK_ATTR_TYPE + "(\\d)");

    assert.match(data, LINK_ATTR_EXPR);
    assert.strictEqual(data.match(LINK_ATTR_EXPR)[1], String(expectedRel));
  }

  function getInteresting() {
    var b = tf.beacons[0];
    var trie = JSON.parse(b.restiming);

    return trie[location.protocol + "//" + location.host + "/"]["pages/11-restiming/"]["support/"];
  }

  it("Should pass basic beacon validation", function(done){
    t.validateBeaconWasSent(done);
  });

  it("Should find the link elements", function() {
    if (!t.isResourceTimingSupported()) {
      this.skip();

      return;
    }

    var b = tf.beacons[0];

    ResourceTimingDecompression.HOSTNAMES_REVERSED = false;
    var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));
    var foundURLs = resources.reduce(function(arr, r) {
      arr.push(r.name);

      return arr;
    }, []);

    var a = document.createElement("a");
    var expectedURLs = [
      "./support/09.js",
      "./support/09.jpg",
      "./support/09.css"
    ].reduce(function(arr, url) {
      a.href = url;
      arr.push(a.href);

      return arr;
    }, []);

    assert.includeMembers(foundURLs, expectedURLs);
  });

  it("Should find stylesheet `rel` for link elements", function() {
    if (!t.isResourceTimingSupported()) {
      this.skip();

      return;
    }

    var interesting = getInteresting();

    assertLinkRel(interesting["09.css"], BOOMR.plugins.ResourceTiming.REL_TYPES.stylesheet);
  });

  it("Should find script `rel` for link elements", function() {
    if (!t.isResourceTimingSupported()) {
      return this.skip();
    }

    var interesting = getInteresting();

    var a = document.createElement("a");

    a.href = "./support/09.js";
    var resource = t.findFirstResource(a.href);

    if (resource.initiatorType === "link") {
      // Chrome sets initiatorType to link
      assertLinkRel(interesting["09.js"], BOOMR.plugins.ResourceTiming.REL_TYPES.preload);
    }
    else {
      // FF, Edge and Safari set initiatorType to script
      this.skip();
    }
  });

  it("Should find image `rel` for link elements", function() {
    if (!t.isResourceTimingSupported()) {
      this.skip();

      return;
    }

    var interesting = getInteresting();

    var a = document.createElement("a");

    a.href = "./support/09.jpg";
    var resource = t.findFirstResource(a.href);

    if (resource.initiatorType === "link") {
      // Chrome sets initiatorType to link
      assertLinkRel(interesting["09.jpg"], BOOMR.plugins.ResourceTiming.REL_TYPES.preload);
    }
    else {
      // FF, Edge and Safari set initiatorType to img
      this.skip();
    }
  });
});
