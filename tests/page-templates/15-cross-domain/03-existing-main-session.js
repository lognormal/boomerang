/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/15-cross-domain/03-existing-main-session", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	// Source values to check and sync with tested values here should be found in support/session-mock.js
	it("Should have picked up the session ID from the existing session on the domain and applied it to the local session", function() {
		assert.equal(BOOMR.session.ID, "mocked-id");
	});

	it("Should merge back mocked session data in main page to main domain", function() {
		assert.equal(window.childSessionData.si, BOOMR.session.ID);
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

	it("Should have a session length of 11 from the 10 prior to loading the page", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));
		var b = tf.lastBeacon();
		// Off By One error or t_done not defined because phantomjs
		if (b["rt.obo"]) {
			// If 2 off by ones are recorded we can expect the length to be 12
			// as both main and crossdomain is having trouble getting the page done
			assert.equal(parseInt(b["rt.obo"]) + 10, 12);
			return;
		}
		else {
			assert.equal(parseInt(cookie.sl), 11);
		}
	});

	it("Should have a rt.tt of 666 (mocked session total time across session) + beacons t_done", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));
		var b = tf.lastBeacon();

		// Off By One error or t_done not defined because phantomjs
		if (b["rt.obo"]) {
			return;
		}
		else {
			assert.isDefined(b.t_done, "t_done is not defined");
			assert.isNumber(b.t_done, "t_done is not a number");
			assert.equal(parseInt(cookie.tt), parseInt(b.t_done) + 666);
		}
	});
});

