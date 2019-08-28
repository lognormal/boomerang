/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/25-cookie/00-cookie-null", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should not have included rt.ss on the beacon", function() {
		assert.isUndefined(tf.lastBeacon()["rt.ss"]);
	});

	it("Should not have included rt.sl on the beacon", function() {
		assert.isUndefined(tf.lastBeacon()["rt.sl"]);
	});

	it("Should not have included rt.si on the beacon", function() {
		assert.isUndefined(tf.lastBeacon()["rt.si"]);
	});
});
