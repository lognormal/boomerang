/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["myevent"]);

describe("e2e/00-basic/02-events", function() {
  var tf = BOOMR.plugins.TestFramework;

  it("Should have fired myevent with the correct data", function() {
    assert.equal("a", window.myevent);
  });
});
