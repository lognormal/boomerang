/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, [
  "angular",
  "ng339",
  "modules",
  "app",
  "routeWaits",
  "routeNumber",
  "angular_imgs",
  "angular_html5_mode",
  "angular_nav_routes",
  "spaWaitCompleteTimes",
  "angular_route_wait",
  "custom_metric_1",
  "custom_metric_2",
  "custom_timer_1",
  "custom_timer_2",
  "i"
]);

describe("e2e/05-angular/17-wait", function() {
  BOOMR_test.templates.SPA["17-wait"]();
});
