/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/17-memory/03-nav-battery-api-present", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have the battery level defined.", function() {
		var b = tf.lastBeacon();

		var batteryLevel = b["bat.lvl"];
		assert.isDefined(batteryLevel);
		assert.isNumber(batteryLevel);
	});
});
