/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/03-non-epoch-navtiming", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should not have t_resp (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			var b = tf.lastBeacon();
			assert.isUndefined(b.t_resp);
		}
	});

	it("Should not have t_page (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			var b = tf.lastBeacon();
			assert.isUndefined(b.t_page);
		}
	});

	it("Should have nt_bad (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			var b = tf.lastBeacon();
			assert.isDefined(b.nt_bad);
		}
	});

	it("Should not have an error param on the beacon", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b.errors);
	});
});
