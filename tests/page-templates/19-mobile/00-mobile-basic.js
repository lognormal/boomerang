/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/19-mobile/00-mobile-basic", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have at least one key starting with mob", function() {
		if (t.isNetworkAPISupported()) {
			var k, actual = false, b = tf.beacons[0];

			for (k in b) {
				if (k.indexOf("mob") === 0) {
					actual = true;
				}
			}

			assert.isTrue(actual);
		}
	});
});
