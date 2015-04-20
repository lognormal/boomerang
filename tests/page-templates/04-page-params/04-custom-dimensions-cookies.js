/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/04-custom-dimensions-cookies", function() {
    var tf = BOOMR.plugins.TestFramework;
    var t = BOOMR_test;

    it("Should pass basic beacon validation", function(done) {
        t.validateBeaconWasSent(done);
    });

    it("Should be missing custom dimension 1 - Cookie", function() {
        var b = tf.lastBeacon();
        assert.equal(b["cdim.CD1"], undefined);
    });
});
