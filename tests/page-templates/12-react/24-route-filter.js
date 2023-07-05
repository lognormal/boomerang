/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["navs", "imgs", "html5_mode", "nav_routes", "history_route_filter", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "i"]);

describe("e2e/12-react/24-route-filter", function() {
  BOOMR_test.templates.SPA["24-route-filter"]();
});
