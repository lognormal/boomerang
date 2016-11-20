/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/11-restiming/01-clear-onbeacon-disabled", function() {
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done){
		t.validateBeaconWasSent(done);
	});

	it("Should not clear ResourceTiming array after beacon (if ResourceTiming is enabled)", function(){
		if (t.isResourceTimingSupported()) {
			var entries = window.performance.getEntriesByType("resource");
			assert.isTrue(entries.length > 0);
		}
	});
});
