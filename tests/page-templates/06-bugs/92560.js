/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/92560", function() {
    var tf = BOOMR.plugins.TestFramework;

    it("Should get 2 beacons: 1 onload, 1 xhr (2nd xhr should be excluded)", function()
    {
      assert.equal(tf.beaconCount(), 2);
    });
});
