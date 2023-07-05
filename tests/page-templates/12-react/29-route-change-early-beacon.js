/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["imgs", "html5_mode", "nav_routes", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "img", "i"]);

describe("e2e/12-react/29-route-change-early-beacon", function() {
  BOOMR_test.templates.SPA["29-route-change-early-beacon"]();
});
