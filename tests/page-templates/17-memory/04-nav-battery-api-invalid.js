/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/17-memory/04-nav-battery-api-invalid", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should not have the battery level defined on beacon when Battery API gives invalid values.", function() {
		var b = tf.lastBeacon();

		var batteryLevel = b["bat.lvl"];
		assert.isUndefined(batteryLevel);
	});
});
