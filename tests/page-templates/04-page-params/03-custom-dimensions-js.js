/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/03-custom-dimensions-js", function() {
    var tf = BOOMR.plugins.TestFramework;
    var t = BOOMR_test;

    it("Should pass basic beacon validation", function(done) {
        t.validateBeaconWasSent(done);
    });

    it("Should have the custom dimension 1 - JavaScript var Boolean", function() {
        var b = tf.lastBeacon();
        assert.equal(b["cdim.CD1"], "true");
    });

    it("Should have the custom dimension 2 - JavaScript function Boolean", function() {
        var b = tf.lastBeacon();
        assert.equal(b["cdim.CD2"], "false");
    });

    it("Should have the custom dimension 3 - JavaScript var Numeric", function() {
        var b = tf.lastBeacon();
        assert.equal(b["cdim.CD3"], "111");
    });

    it("Should have the custom dimension 4 - JavaScript function Numeric", function() {
        var b = tf.lastBeacon();
        assert.equal(b["cdim.CD4"], "222");
    });

    it("Should have the custom dimension 5 - JavaScript Var Text", function() {
        var b = tf.lastBeacon();
        assert.equal(b["cdim.CD5"], "abc");
    });

    it("Should have the custom dimension 6 - JavaScript function Text", function() {
        var b = tf.lastBeacon();
        assert.equal(b["cdim.CD6"], "def");
    });

    it("Should be missing custom dimension 7 - JavaScript var missing", function() {
        var b = tf.lastBeacon();
        assert.equal(b["cdim.CD7"], undefined);
    });

    it("Should be missing custom dimension 8 - QueryParam", function() {
        var b = tf.lastBeacon();
        assert.equal(b["cdim.CD8"], undefined);
    });
});
