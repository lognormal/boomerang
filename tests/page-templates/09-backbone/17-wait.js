/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, [
  "$",
  "jQuery",
  "Handlebars",
  "Backbone",
  "routeWaits",
  "routeNumber",
  "backbone_imgs",
  "backbone_html5_mode",
  "backbone_nav_routes",
  "spaWaitCompleteTimes",
  "backbone_route_wait",
  "app",
  "Widgets",
  "AppRouter",
  "hookOptions",
  "hadRouteChange",
  "hookBackboneBoomerang",
  "backbone_start",
  "custom_metric_1",
  "custom_metric_2",
  "custom_timer_1",
  "custom_timer_2",
  "i"
]);

describe("e2e/09-backbone/17-wait", function() {
  BOOMR_test.templates.SPA["17-wait"]();
});
