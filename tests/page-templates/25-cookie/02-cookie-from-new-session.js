/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/25-cookie/02-cookie-from-new-session", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have set the Compression Level (z)", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.isDefined(cookie.z);
	});

	it("Should have set the Session ID (si)", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.isDefined(cookie.si);
	});

	it("Should have a Session Length (sl) of 1", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.equal(cookie.sl, 1);
	});

	it("Should have a Session Start (ss) of around now", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		var startTime = +(new Date());
		var ss = parseInt(cookie.ss, 36);

		// greater than 60 seconds ago
		assert.operator(ss, ">=", startTime - 60000);

		// not in the future
		assert.operator(ss, "<", startTime);
	});

	it("Should have a Total Time (tt) of the same duration as the navigation", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.equal(parseInt(cookie.tt, 36), tf.lastBeacon().t_done || 0);
	});

	it("Should not have Off By One (obo) set (if NavigationTiming is supported)", function() {
		if (!t.isNavigationTimingSupported()) {
			return this.skip();
		}

		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.isUndefined(cookie.obo);
	});

	it("Should have Off By One (obo) set (if NavigationTiming is not supported)", function() {
		if (t.isNavigationTimingSupported()) {
			return this.skip();
		}

		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.equal(cookie.obo, 1);
	});

	it("Should have set the Beacon URL (bcn)", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.equal(cookie.bcn, "/beacon");
	});

	it("Should have set the Beacon Domain (dm)", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.equal(cookie.dm, "boomerang-test.local");
	});

	it("Should not have set Session Expiry (se)", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.isUndefined(cookie.se);
	});

	it("Should not have set Rate Limited (rl)", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.isUndefined(cookie.rl);
	});

	it("Should have set the Load Time (ld)", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		var startTime = +(new Date());
		var ld = parseInt(cookie.ld, 36) + parseInt(cookie.ss, 36);

		// greater than 60 seconds ago
		assert.operator(ld, ">=", startTime - 60000);

		// not in the future
		assert.operator(ld, "<", startTime);
	});

	it("Should not have set Before Unload Time (ul)", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.isUndefined(cookie.ul);
	});

	it("Should not have set Unload Time (hd)", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.isUndefined(cookie.hd);
	});

	it("Should not have set Click Time (cl)", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.isUndefined(cookie.cl);
	});

	it("Should not have set Referrer (r)", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.isUndefined(cookie.r);
	});

	it("Should not have set New URL (nu)", function() {
		var cookie = BOOMR.utils.getSubCookies(BOOMR.utils.getCookie("RT"));

		assert.isUndefined(cookie.nu);
	});
});
