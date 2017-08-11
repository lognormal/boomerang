/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/15-cross-domain/01-child-iframe-delayed", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have \"rt.sstr_dur\" beacon param with the duration for the session to be transferred around 300ms", function() {
		var b = tf.lastBeacon();
		assert.closeTo(b["rt.sstr_dur"], 300, 750);
	});

	it("Should not include a the session transfer timed out flag ", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b["rt.sstr_to"]);
	});
});
