/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["html5_mode", "imgs", "nav_routes", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "i"]);

describe("e2e/12-react/07-soft-nav-resources", function() {
  BOOMR_test.templates.SPA["07-soft-nav-resources"]();
});
