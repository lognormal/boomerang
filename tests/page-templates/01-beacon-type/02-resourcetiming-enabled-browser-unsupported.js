/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/01-beacon-type/02-resourcetiming-enabled-browser-unsupported", function() {
	it("Should send an Image beacon if ResourceTiming is enabled, but the browser doesn't support it", function(done) {
		if (!BOOMR_test.isResourceTimingSupported()) {
			BOOMR_test.validateBeaconWasImg(done);
		}
		else {
			// NOTE: If not, another test handles
			done();
		}
	});
});
