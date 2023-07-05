/* eslint-env mocha */
/* global assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["s"]);

describe("e2e/06-bugs/95726", function() {
  var tf = BOOMR.plugins.TestFramework;

  it("Should send a beacon", function(){
    assert.isTrue(tf.fired_onbeacon);
  });
});
