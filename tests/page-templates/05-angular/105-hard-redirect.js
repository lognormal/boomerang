/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/05-angular/105-hard-redirect", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;
	var assert = window.chai.assert;

	it("Should have sent one beacon", function() {
		assert.isDefined(window.beacon);
	});

	it("Should have included the redirection time in t_resp (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			assert.operator(window.beacon.t_resp, ">=", 3000);
		}
	});

	it("Should not have a t_resp (if NavigationTiming is not supported)", function() {
		if (!t.isNavigationTimingSupported()) {
			assert.isUndefined(window.beacon.t_resp);
		}
	});

	it("Should have t_resp + t_page = t_done (if NavigationTiming is supported)", function() {
		if (t.isNavigationTimingSupported()) {
			assert.equal(window.beacon.t_done, window.beacon.t_resp + window.beacon.t_page);
		}
	});
});
