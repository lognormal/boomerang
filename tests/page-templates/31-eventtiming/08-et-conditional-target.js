/* eslint-env mocha */
/* global BOOMR_test,assert */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["PerformanceEventTiming", "testSelector", "POs"]);

describe("e2e/31-eventtiming/08-et-conditional-target", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  // target information on event that has target
  it("Should have included target information for the event", function() {
    assert.include(tf.beacons[0]["et.e"], "~(c~0~d~'1e~n~0~p~'1e~s~'rs~t~'div.test)");
  });
  // no empty target information should be sent
  it("Should not have included empty target information", function() {
    assert.include(tf.beacons[0]["et.e"], "~(c~0~d~'1e~n~3~p~'1e~s~'1jk)~(c~0~d~'28~n~1~p~'2s~s~'2bc))");
  });
});
