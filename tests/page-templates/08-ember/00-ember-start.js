/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/08-ember/00-ember-start", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have only sent one beacon", function() {
		assert.equal(tf.beacons.length, 1);
	});

	it("Should have sent the http.initiator as 'spa'", function() {
		var b = tf.lastBeacon();
		assert.equal(b["http.initiator"], "spa");
	});
});
