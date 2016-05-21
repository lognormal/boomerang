/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/15-cross-domain/00-post-message-beacon", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have \"rt.sstr_dur\" beacon param with the duration for the session to be transferred in under 500 miliseconds", function() {
		var b = tf.lastBeacon();
		assert.closeTo(b["rt.sstr_dur"], 0, 500);
	});

	it("Should have BOOMR.session.id from the iframe of the main session", function() {
		var b = tf.lastBeacon();
		assert.include(b["rt.si"], window.childSessionData.ID, "rt.si should include `framedomain` from inside the frame");
	});

	it("Should have a session length matching childIframe", function() {
		var b = tf.lastBeacon();
		assert.equal(b["rt.sl"], window.childSessionData.length + 1, "Session Length should increment by one since we visited initial page");
	});

	it("Should have session session start matching the child IFrame", function() {
		var b = tf.lastBeacon();
		assert.equal(b["rt.ss"], window.childSessionData.start, 1000, "Session Start time should match child IFrame");
	});

	it("Should not include a the session transfer timed out flag ", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b["rt.sstr_to"]);
	});
});
