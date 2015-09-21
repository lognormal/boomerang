/*eslint-env mocha*/
/*global assert*/

describe("05-xhr-before-onload-alwayssendxhr", function() {
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

	it("Should have the first beacon be an XHR", function() {
		assert.equal(tf.beacons[0]["http.initiator"], "xhr");
	});

	it("Should have the first beacon have a restiming parameter", function() {
		assert.isDefined(tf.beacons[0].restiming);
	});

	it("Should have the second beacon be a navigation", function() {
		assert.equal(tf.beacons[1]["rt.start"], "navigation");
	});

	it("Should have the second have a resiming parameter", function() {
		assert.isDefined(tf.beacons[1].restiming);
	});
});
