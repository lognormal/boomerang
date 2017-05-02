/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/07-iframes", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 2 beacons: 1 onload, 1 xhr (XMLHttpRequest !== null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 2);
			});
	});

	it("Should get 1 beacons: 1 onload (XMLHttpRequest === null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			function() {
				t.ensureBeaconCount(done, 1);
			},
			done);
	});

	it("Should have the second beacon be an XHR (XMLHttpRequest !== null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				assert.equal(tf.beacons[1]["http.initiator"], "xhr");
				done();
			});
	});
});
