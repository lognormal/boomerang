/*eslint-env mocha*/
/*global assert*/

describe("e2e/11-restiming/05-no-beacon-url", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 3 beacons: 1 onload, 2 xhr (XMLHttpRequest !== null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 3);
			});
	});

	it("None of the beacons should have the beacon URL in restiming", function() {
		for (var i = 0; i < 3; i++) {
			assert.notInclude(tf.beacons[i].restiming, "blackhole");
		}
	});
});
