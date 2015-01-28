/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/01-beacon-type/00-resourcetiming-disabled", function() {
    it("Should send an Image beacon beacuse ResourceTiming is disabled", function(done) {
        BOOMR_test.validateBeaconWasImg(done);
    });
});
