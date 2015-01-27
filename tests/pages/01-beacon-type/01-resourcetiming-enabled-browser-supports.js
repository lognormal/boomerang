/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/01-beacon-type", function() {
    it("Should send a FORM beacon if ResourceTiming is enabled and the browser supports it", function(done) {
        if (BOOMR_test.isResourceTimingSupported()) {
            BOOMR_test.validateBeaconWasForm(done);
        } else {
            // NOTE: If not, another test handles
            done();
        }
    });
});
