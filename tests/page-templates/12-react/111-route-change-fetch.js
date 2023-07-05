/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["imgs", "html5_mode", "nav_routes", "use_fetch", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "i"]);

describe("e2e/12-react/111-route-change-fetch", function() {
  var tf = BOOMR.plugins.TestFramework;
  var t = BOOMR_test;

  if (t.isFetchApiSupported()) {
    BOOMR_test.templates.SPA["04-route-change"]();

    it("Should have sent the second beacon with a duration of between 2 and 3 seconds", function() {
      assert.operator(tf.beacons[1].t_done, ">=", 2000);
      assert.operator(tf.beacons[1].t_done, "<=", 3000);
    });
  }
  else {
    it.skip("Should only run tests if Fetch API is supported");
  }
});
