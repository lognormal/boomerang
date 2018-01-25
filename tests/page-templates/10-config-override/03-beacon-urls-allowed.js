/*eslint-env mocha*/
/*global BOOMR_test,assert,BOOMR*/

describe("e2e/10-config-override/03-beacon-urls-allowed", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});
});
