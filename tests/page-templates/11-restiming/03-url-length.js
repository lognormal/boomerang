/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/11-restiming/03-url-length", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have a restiming parameter on the beacon (if ResourceTiming is supported)", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			assert.isDefined(b.restiming);
		}
		else {
			this.skip();
		}
	});

	it("Should have trimmed the long URL (if ResourceTiming is supported)", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();

			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

			// find our img
			assert.isDefined(BOOMR.utils.arrayFind(resources, function(r) {
				return r.name.indexOf("blackhole?...") !== -1;
			}), "Find blackhole?...");
		}
		else {
			this.skip();
		}
	});

	it("Should have trimmed the pixel URL (if ResourceTiming is supported)", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var resources = ResourceTimingDecompression.decompressResources(JSON.parse(b.restiming));

			// find our img
			assert.isDefined(BOOMR.utils.arrayFind(resources, function(r) {
				return r.name.indexOf("/foo/...") !== -1;
			}), "Find /foo/...");
		}
		else {
			this.skip();
		}
	});
});
