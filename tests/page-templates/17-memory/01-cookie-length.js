/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/17-memory/01-cookie-length", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have cookie length of 37 or 38 for HTTPS pages", function() {
		assert.equal(tf.lastBeacon()["dom.ck"], 37 + location.protocol === "https:" ? 1 : 0);
	});
});
