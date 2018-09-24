/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/25-cookie/02-cookie-from-new-session", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have a Session Expiry (se) of 100", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.equal(parseInt(cookie.se, 36), 100);
	});
});
