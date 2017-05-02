/*eslint-env mocha*/
/*global BOOMR_test,it,describe,assert*/
describe("e2e/12-react/105-no-xhr-before-hard-nav", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent one beacon", function() {
		assert.equal(tf.beacons.length, 1);
	});

	it("Should have sent the first beacon as http.initiator = spa_hard", function() {
		assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
	});

});
