/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,assert*/

describe("e2e/15-cross-domain/05-transfer-session-cookie-mock", function(){
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should merge back mocked session data in main page to main domain", function() {
		assert.equal(window.childSessionData.ID, BOOMR.session.ID);
	});

	it("Should have the cookies beacon URL pointing to /blackhole/no-op instead of /blackhole", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));
		assert.equal(cookie.bcn, "/blackhole/no-op", "Beacon URL does not match primary domains session Beacon URL");
		assert.equal(BOOMR.getBeaconURL(), "/blackhole/no-op", "getBeaconURL() did not return correct URL");
	});

	it("Should have a mocked Session ID in the cookie of \"mocked-id\"", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));
		assert.equal(cookie.si, "mocked-id", "Session ID matches with mocked main domain");
	});

	it("Should have a session length of 12 from the 10 prior to loading the page", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));
		assert.equal(cookie.sl, 12);
	});

	it("Should have a load of around 700 or 666 transferred from the mocked session", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));
		assert.closeTo(parseInt(cookie.tt), 700, 100);
	});
});
