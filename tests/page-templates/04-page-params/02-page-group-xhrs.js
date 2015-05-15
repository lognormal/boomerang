/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/02-page-group-xhrs", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent two beacons", function(done) {
		var _this = this;
		tf.ifAutoXHR(
			done,
			function() {
				_this.timeout(10000);
				tf.ensureBeaconCount(done,  2);
			});
	});

	it("Should set the Page Group of the first beacon 'Test Pages'", function() {
		var b = tf.beacons[0];
		assert.equal(b["h.pg"], "Test Pages");
	});

	it("Should get only 2 beacons: 1 onload, 1 xhr (2nd xhr should be excluded)", function(done) {
		tf.ifAutoXHR(
			done,
			function() {
				var b = tf.lastBeacon();
				assert.equal(b["xhr.pg"], "Test Pages");
				done();
			});
	});
});
