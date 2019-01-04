/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/13-logn/16-akai-on-config-req-akai-int-as-NaN", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have ak.ai param set to NaN", function() {
		assert.isDefined(BOOMR.plugins.AK.akVars, "Expected akVars to be defined in test setup");
		assert.isTrue(isNaN(BOOMR.plugins.AK.akVars["ak.ai"]), "Expected ak.ai to be set to NaN");
	});

	it("Should not have have ak.ai parameter included in the config request.", function() {
		assert.isDefined(window.xhrConfigRequestUrl);
		var queryCharIndex = window.xhrConfigRequestUrl.indexOf("config?");
		assert.isTrue(queryCharIndex > 0);

		// the "ak.ai" query param should not be present after the "query?" query marker.
		assert.isTrue(window.xhrConfigRequestUrl.indexOf("&ak.ai=567765", queryCharIndex + 7) === -1);
	});
});
