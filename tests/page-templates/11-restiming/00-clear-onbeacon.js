/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/11-restiming/00-clear-onbeacon", function() {
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done){
		t.validateBeaconWasSent(done);
	});

	it("Should clear ResourceTiming array after beacon (if ResourceTiming is enabled)", function(){
		if (t.isResourceTimingSupported()) {
			var entries = window.performance.getEntriesByType("resource");
			assert.equal(entries.length, 0);
		}
	});
});
