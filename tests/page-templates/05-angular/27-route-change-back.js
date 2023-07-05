/* eslint-env mocha */
/* global BOOMR_test,assert,angular */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["angular", "ng339", "angular_imgs", "angular_html5_mode", "angular_nav_routes", "modules", "app", "beaconNum", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "i"]);

describe("e2e/05-angular/27-route-change-back", function() {
  // use tests from #4
  BOOMR_test.templates.SPA["04-route-change"]();
});
