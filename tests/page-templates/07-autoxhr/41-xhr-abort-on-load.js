/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/41-xhr-abort-on-load", function() {
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

	it("Should have the second beacon be an XHR (XMLHttpRequest !== null)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.lastBeacon();
				assert.equal(b["http.initiator"], "xhr");

				done();
			});
	});

	it("Should have the second beacon with http.errno set to XHR_STATUS_ABORT (XMLHttpRequest !== null)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.lastBeacon();
				assert.equal(b["http.errno"], -999);

				done();
			});
	});
});
