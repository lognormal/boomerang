/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/11-restiming/13-addResources", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should decompress correctly", function() {
		if (!t.isResourceTimingSupported()) {
			return this.skip();
		}

		var b = tf.lastBeacon();

		ResourceTimingDecompression.HOSTNAMES_REVERSED = false;
		var entries = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

		var spacer = location.protocol + "//" + location.host + "/pages/11-restiming/support/spacer.gif";

		var interesting = {};
		interesting[spacer] = [];
		interesting["http://example.com/script1.js"] = [];
		interesting["http://example.com/script2.js"] = [];

		entries.forEach(function(entry) {
			if (interesting[entry.name]) {
				interesting[entry.name].push(entry);
			}
		});

		// script1.js
		assert.lengthOf(interesting["http://example.com/script1.js"], 1, "there should be 1 RT entry for script1.js");
		var entry = interesting["http://example.com/script1.js"][0];
		assert.equal(entry.startTime, 300);
		assert.equal(entry.initiatorType, "script");
		assert.isObject(entry._data);
		assert.deepEqual(entry._data, {"ns5": "namespaced_payload_5"});

		// script2.js
		assert.lengthOf(interesting["http://example.com/script2.js"], 1, "there should be 1 RT entry for script2.js");
		var entry = interesting["http://example.com/script2.js"][0];
		assert.equal(entry.startTime, 400);
		assert.equal(entry.initiatorType, "script");
		assert.isObject(entry._data);
		assert.deepEqual(entry._data, {"ns6": "namespaced_payload_6", "ns7": "namespaced_payload_7"});

		// spacer.gif
		assert.lengthOf(interesting[spacer], 1, "there should be 1 RT entry for spacer.gif");
		var entry = interesting[spacer][0];
		assert.isObject(entry._data);
		assert.deepEqual(entry._data, {
			"ns1": ["namespaced_payload_1_a", "namespaced_payload_1_b"],
			"ns2": "namespaced_payload_2",
			"ns3": "namespaced_payload_3"
		});

	});
});
