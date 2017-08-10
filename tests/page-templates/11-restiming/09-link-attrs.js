/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/11-restiming/09-link-attrs", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done){
		t.validateBeaconWasSent(done);
	});

	it("Should find the link elements", function() {
		if (!t.isResourceTimingSupported()) {
			return;
		}

		var b = tf.beacons[0];

		var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));
		var foundURLs = resources.reduce(function(arr, r) {
			arr.push(r.name);
			return arr;
		}, []);
		debugger;

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

	it("Should find `rel` for link elements", function() {
		if (!t.isResourceTimingSupported()) {
			return;
		}

		var RT = BOOMR.plugins.ResourceTiming;
		var LINK_ATTR_EXPR = new RegExp("^.*\\" + RT.SPECIAL_DATA_PREFIX + RT.SPECIAL_DATA_LINK_ATTR_TYPE);

		var b = tf.beacons[0];

		var trie = JSON.parse(b.restiming);
		var interesting = trie[location.protocol + "//" + location.host + "/"]["pages/11-restiming/"]["support/09."];

		function assertLinkRel(data, expectedRel) {
			assert.match(data, LINK_ATTR_EXPR);
			assert.strictEqual(data.replace(LINK_ATTR_EXPR, ""), String(expectedRel));
		}

		assertLinkRel(interesting.j.pg, RT.REL_TYPES.preload);
		assertLinkRel(interesting.j.s, RT.REL_TYPES.preload);
		assertLinkRel(interesting.css, RT.REL_TYPES.stylesheet);
	});
});
