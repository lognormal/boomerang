/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/01-beacon-type/03-resourcetiming-enabled-browser-supports-over-2k", function() {
	it("Should send a XHR beacon if ResourceTiming is enabled and the browser supports it and the length is over 2k characters", function(done) {
		if (BOOMR_test.isResourceTimingSupported()) {
			BOOMR_test.validateBeaconWasXhr(done);
		}
		else {
			// NOTE: If not, another test handles
			done();
		}
	});
});
