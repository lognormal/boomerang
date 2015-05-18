/*eslint-env mocha*/

describe("e2e/07-autoxhr/00-xhrs", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 5 beacons: 1 onload, 4 xhr (XMLHttpRequest !== null)", function(done) {
		tf.ifAutoXHR(
			done,
			function() {
				tf.ensureBeaconCount(done, 5);
			});
	});

	it("Should get 1 beacons: 1 onload, 0 xhr (XMLHttpRequest === null)", function(done) {
		tf.ifAutoXHR(
			done,
			undefined,
			function() {
				tf.ensureBeaconCount(done, 1);
			});
	});

});
