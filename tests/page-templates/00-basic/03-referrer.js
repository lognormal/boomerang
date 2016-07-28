/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/00-basic/03-referrer", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("The referrer should have been set to this window's location", function() {
		// ensure there was a referrer on the IFRAME beacon
		chai.assert.equal(window.lastReferrer, window.location.href);
	});
});
