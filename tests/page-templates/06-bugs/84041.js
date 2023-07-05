/* eslint-env mocha */
/* global assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["BOOMR_start"]);

describe("e2e/06-bugs/84041", function() {
  it("Should have only been initialized once", function() {
    assert.equal(1, BOOMR.plugins.Test.initCount);
  });
});
