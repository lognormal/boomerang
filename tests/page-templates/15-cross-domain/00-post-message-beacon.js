/*eslint-env mocha*/
/*global BOOMR_test,assert*/

/*
  Simple test to ensure communication between Alias and main domain works

  Q: Main, do you have a session to transfer?
  +---------+        +----------+
  |  Alias  +---?---->   Main   |
  +---------+        +----------+

  A: Yes!
  +---------+        +----------+
  |   Main  +---!---->   Alias  |
  +---------+        +----------+

  - Ensures transfer duration is set, we know how long it took to transfer session info from main to alias
  - Ensures we did not timeout when requesting iframe/data
*/

describe("e2e/15-cross-domain/00-post-message-beacon", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have \"rt.sstr_dur\" beacon param with the duration for the session to be transferred in under 750 miliseconds", function() {
		var b = tf.lastBeacon();
		assert.closeTo(b["rt.sstr_dur"], 0, 750);
	});

	it("Should not include a the session transfer timed out flag ", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b["rt.sstr_to"]);
	});
});
