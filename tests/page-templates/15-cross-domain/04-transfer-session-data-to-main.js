/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,assert*/

describe("e2e/15-cross-domain/04-transfer-session-data-to-main", function(){
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should merge back mocked session data in main page to main domain", function() {
		assert.equal(window.childSessionData.si, BOOMR.session.ID);
		assert.equal(BOOMR.session.ID, "mocked-id2");
	});

});
