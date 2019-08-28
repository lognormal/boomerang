/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/00-basic/13-onload-minified", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have added 'undef' with an empty value", function() {
		// we need resourcetiming, as the tf.lastBeacon() will have a direct
		// copy of the input value (undefined), not what ends up on the beacon ('')
		if (!t.isResourceTimingSupported()) {
			return this.skip();
		}

		// ensure the data was sent to 'beacon'
		var rt = t.findResourceTimingBeacon();
		assert.isDefined(rt);
		assert.isTrue(rt.name.indexOf("&undef=&") !== -1);
	});
});
