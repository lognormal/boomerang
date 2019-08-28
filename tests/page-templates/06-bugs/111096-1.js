/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/111096-1", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon (if ResourceTiming is enabled and Boomerang loaded in an IFRAME)", function() {
		if (t.isResourceTimingSupported() && BOOMR.window !== BOOMR.boomerang_frame) {
			assert.notEqual(null, t.findResourceTimingBeacon());
		}
		else {
			return this.skip();
		}
	});

	it("Should not have used sendBeacon", function() {
		assert.isUndefined(tf.beacons[0].sb);
	});
});
