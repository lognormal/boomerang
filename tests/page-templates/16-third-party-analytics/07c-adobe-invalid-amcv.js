/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/16-third-party-analytics/07c-adobe-invalid-amcv", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should be missing Adobe AID", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.aa.aid"], undefined);
	});

	it("Should have Adobe MID set (on a domain or in PhantomJS)", function() {
		if (t.canSetCookies()) {
			var b = tf.lastBeacon();
			assert.equal(b["tp.aa.mid"], "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM");
		}
	});

	it("Should be missing Adobe MID (on localhost or an IP)", function() {
		if (!t.canSetCookies()) {
			var b = tf.lastBeacon();
			assert.equal(b["tp.aa.mid"], undefined);
		}
	});
});
