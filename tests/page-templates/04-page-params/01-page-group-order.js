/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/00-page-groups", function() {
    var tf = BOOMR.plugins.TestFramework;
    var t = BOOMR_test;

    it("Should pass basic beacon validation", function(done) {
        t.validateBeaconWasSent(done);
    });

    it("Should set the Page Group to 111", function() {
        var b = tf.lastBeacon();
        assert.equal(b["h.pg"], 111);
    });
});
