/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["imgs", "nav_routes", "allowAnyFurtherRoutes", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "i"]);

describe("e2e/12-react/19-autoxhr-during-nav-alwayssendxhr", function() {
  BOOMR_test.templates.SPA["19-autoxhr-during-nav-alwayssendxhr"]();
});
