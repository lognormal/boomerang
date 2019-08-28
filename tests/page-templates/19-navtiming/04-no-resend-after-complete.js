/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/19-navtiming/04-no-resend-after-complete", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should only send navigation timing information on second beacon (if NavigationTiming is supported)", function() {
		var b1 = tf.beacons[0];
		assert.isFalse("nt_load_end" in b1);
		var b2 = tf.beacons[1];
		assert.isTrue("nt_load_end" in b2);
		var b3 = tf.beacons[2];
		assert.isFalse("nt_load_end" in b3);
	});
});
