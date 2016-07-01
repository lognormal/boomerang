/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/15-cross-domain/03-existing-main-session", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	// Source values to check and sync with tested values here should be found in support/session-mock.js
	it("Should have picked up the session ID from the existing session on the domain and applied it to the local session", function() {
		assert.equal(BOOMR.session.ID, "mocked-id");
	});
});
