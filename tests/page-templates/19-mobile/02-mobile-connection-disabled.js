/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/19-mobile/02-mobile-connection-disabled", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have no keys starting with mob", function() {
		var k, actual = true, b = tf.beacons[0];

		for (k in b) {
			if (k.indexOf("mob") === 0) {
				actual = false;
			}
		}

		assert.isTrue(actual);
	});
});
