/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/11-restiming/14-splitatpath", function() {
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

	it("Should have split resources by path in the Trie (if ResourceTiming is supported)", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();

			// Should not have "assets/img.jpg?N" full paths in the Trie, they would
			// be split at "assets/" and have both "img.jpg?1" and "img.jpg?2" instead of
			// having "assets/img.jpg?" and split at "1" and "2" in the perfectly
			// optimized case.
			assert.notInclude(b.restiming, "assets/img.jpg");
			assert.include(b.restiming, "img.jpg?1");
			assert.include(b.restiming, "img.jpg?2");
		}
		else {
			this.skip();
		}
	});
});
