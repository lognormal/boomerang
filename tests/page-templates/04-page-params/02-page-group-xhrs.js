/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/02-page-group-xhrs", function() {
    var tf = BOOMR.plugins.TestFramework;
    var t = BOOMR_test;

    it("Should pass basic beacon validation", function(done) {
        t.validateBeaconWasSent(done);
    });

    it("Should have sent two beacons", function() {
        assert.equal(tf.beacons.length, typeof window.MutationObserver === "function" ? 2 : 1);
    });

    it("Should set the Page Group of the first beacon 'Test Pages'", function() {
        var b = tf.beacons[0];
        assert.equal(b["h.pg"], "Test Pages");
    });

    it("Should set the Page Group of the second beacon 'XHR Test Pages' (if the browser supports MutationObserver)", function() {
        if (typeof window.MutationObserver === "function") {
            var b = tf.lastBeacon();
            assert.equal(b["xhr.pg"], "Test Pages");
        }
    });

    it("Should not have a second beacon (if the browser doesn't support MutationObserver)", function() {
        if (typeof window.MutationObserver !== "function") {
            assert.equal(typeof tf.beacons[1], "undefined");
        }
    });
});
