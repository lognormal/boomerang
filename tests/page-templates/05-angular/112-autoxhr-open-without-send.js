/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,describe,it*/

describe("e2e/05-angular/112-autoxhr-open-without-send", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
		clearTimeout(window.timerid);
	});

	it("Should have sent four beacons", function() {
		assert.equal(tf.beacons.length, 4);
	});

	it("Should have sent the first beacon as http.initiator = spa_hard", function() {
		assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
	});

	it("Should have beacon 1 as a spa_hard", function() {
		var b = tf.beacons[0];
		assert.equal(b["http.initiator"], "spa_hard");
	});

	it("Should have beacon 2 as a spa", function() {
		var b = tf.beacons[1];
		assert.equal(b["http.initiator"], "spa");
	});

	it("Should have beacon 3 as a spa", function() {
		var b = tf.beacons[2];
		assert.equal(b["http.initiator"], "spa");
	});

	it("Should have beacon 4 as an xhr", function() {
		var b = tf.beacons[3];
		assert.equal(b["http.initiator"], "xhr");
	});
});

