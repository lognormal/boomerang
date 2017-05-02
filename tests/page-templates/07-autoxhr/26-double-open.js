/*eslint-env mocha*/
/*global assert*/
/*eslint no-loop-func:0*/

describe("e2e/07-autoxhr/26-double-open", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 2 beacons", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 2);
			});
	});

	it("Should have a second beacon that is an XHR", function() {
		if (BOOMR.plugins.AutoXHR) {
			var beacon = tf.beacons[1];
			assert.equal(beacon["http.initiator"], "xhr");
		}
	});

	it("Should have a second beacon with a URL of 404", function() {
		if (BOOMR.plugins.AutoXHR) {
			var beacon = tf.beacons[1];
			assert.include(beacon.u, "404");
		}
	});

	it("Should have a second beacon with a method of POST", function() {
		if (BOOMR.plugins.AutoXHR) {
			var beacon = tf.beacons[1];
			assert.equal(beacon["http.method"], "POST");
		}
	});
});
