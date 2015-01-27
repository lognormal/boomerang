/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/01-beacon-type", function() {
    it("Should send an Image beacon if ResourceTiming is enabled, but the browser doesn't support it", function() {
        if (!BOOMR_test.isResourceTimingSupported()) {
            BOOMR_test.validateBeaconWasImg();
        }

        // NOTE: If not, another test handles
    });
});
