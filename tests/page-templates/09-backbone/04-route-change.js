/* eslint-env mocha */
// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, [
  "$",
  "jQuery",
  "Handlebars",
  "Backbone",
  "backbone_imgs",
  "backbone_html5_mode",
  "backbone_nav_routes",
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

describe("e2e/05-backbone/04-route-change", function() {
  BOOMR_test.templates.SPA["04-route-change"]();
});
