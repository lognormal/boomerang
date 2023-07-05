/* eslint-env mocha */
/* global BOOMR_test,assert,angular */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["imgs", "html5_mode", "nav_routes", "disableBoomerangHook", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "i"]);

describe("e2e/12-react/31-change-img-src", function() {
  // use tests from #4
  BOOMR_test.templates.SPA["04-route-change"]();
});
