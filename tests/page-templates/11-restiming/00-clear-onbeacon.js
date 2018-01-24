/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/11-restiming/00-clear-onbeacon", function() {
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should clear ResourceTiming array after beacon (if ResourceTiming is enabled)", function() {
		var a;
		if (t.isResourceTimingSupported()) {
			var entries = window.performance.getEntriesByType("resource");
			if (entries.length === 1) {
				// if we have 1 entry then it should be the beacon
				a = document.createElement("a");
				a.href = entries[0].name;
				assert.equal(a.pathname, BOOMR.getBeaconURL());
			}
			else {
				assert.equal(entries.length, 0);
			}
		}
		else {
			this.skip();
		}
	});
});
