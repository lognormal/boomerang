/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/16-third-party-analytics/06-adobe-cookie-amcv", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have Adobe AID set (on a domain or in PhantomJS)", function() {
		if (t.canSetCookies()) {
			var b = tf.lastBeacon();
			assert.equal(b["tp.aa.aid"], "AAAAAAAAAAAAAAAA-AAAAAAAAAAAAAAAA");
		}
	});

	it("Should be missing Adobe AID (on localhost or an IP)", function() {
		if (!t.canSetCookies()) {
			var b = tf.lastBeacon();
			assert.equal(b["tp.aa.aid"], undefined);
		}
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
