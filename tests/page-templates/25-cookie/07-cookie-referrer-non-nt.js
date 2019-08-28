/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/25-cookie/07-cookie-referrer-non-nt", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have set Referrer (r)", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.equal(cookie.r, BOOMR.utils.MD5(document.URL));
	});
});
