/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/25-cookie/01-cookie-deprecated", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should not have included Session History (rt.sh) in the cookie", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));
		assert.isUndefined(cookie.sh, "Session History should be removed");
	});
});
