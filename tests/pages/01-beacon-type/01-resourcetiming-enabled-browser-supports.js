/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/01-beacon-type", function() {
    it("Should send a FORM beacon if ResourceTiming is enabled and the browser supports it", function() {
        if (BOOMR_test.isResourceTimingSupported()) {
            BOOMR_test.validateBeaconWasForm();
        }

        // NOTE: If not, another test handles
    });
});
