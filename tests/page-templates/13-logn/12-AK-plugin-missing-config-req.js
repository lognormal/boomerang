/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/13-logn/12-AK-plugin-missing-config-req", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should not have ak.ai parameter included in the config request.", function() {
		assert.isUndefined(BOOMR.plugins.AK);

		assert.isDefined(window.xhrConfigRequestUrl);
		var queryCharIndex = window.xhrConfigRequestUrl.indexOf("config?");
		assert.isTrue(queryCharIndex > 0);

		// the "ak.ai" query param should not be present after the "query?" query marker.
		assert.isTrue(window.xhrConfigRequestUrl.indexOf("&ak.ai=", queryCharIndex + 7) === -1);
	});
});
