/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/02-snippet/00-snippet", function() {
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});
});
