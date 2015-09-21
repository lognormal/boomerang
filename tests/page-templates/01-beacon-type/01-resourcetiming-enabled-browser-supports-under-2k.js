/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/01-beacon-type/01-resourcetiming-enabled-browser-supports-under-2k", function() {
	it("Should send a IMG beacon if ResourceTiming is enabled and the browser supports it and the length is under 2k characters", function(done) {
		if (BOOMR_test.isResourceTimingSupported()) {
			BOOMR_test.validateBeaconWasImg(done);
		}
		else {
			// NOTE: If not, another test handles
			done();
		}
	});
});
