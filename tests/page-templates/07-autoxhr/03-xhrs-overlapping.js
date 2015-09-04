/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/03-xhrs-overlapping", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 2 beacons: 1 onload, 1 xhr (XMLHttpRequest !== null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				assert.lengthOf(tf.beacons, 2);
				done();
			});
	});

	it("Should have the second beacon contain the URL of the second XHR", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				assert.include(tf.beacons[1].u, "?2");
				done();
			});
	});

	it("Should get 1 beacons: 1 onload, 0 xhr (XMLHttpRequest === null)", function(done) {
		t.ifAutoXHR(
			done,
			undefined,
			function() {
				t.ensureBeaconCount(done, 1);
			});
	});

});
