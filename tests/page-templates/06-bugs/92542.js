/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/06-bugs/92542", function() {
    var tf = BOOMR.plugins.TestFramework;

    it("Should not have any errors", function() {
        assert.equal(typeof tf.lastBeacon().errors, "undefined");
    });
});
