/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/122358-document-write", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function(done) {
		t.ensureBeaconCount(done, 1);
	});
});
