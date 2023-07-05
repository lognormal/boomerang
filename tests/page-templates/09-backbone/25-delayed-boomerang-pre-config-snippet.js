/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, [
  "BOOMR_script_delay",
  "$",
  "jQuery",
  "Handlebars",
  "Backbone",
  "timestamp",
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
  "custom_timer_2"
]);

describe("e2e/09-backbone/25-delayed-boomerang-pre-config-snippet", function() {
  BOOMR_test.templates.SPA["25-delayed-boomerang-pre-config-snippet"]();
});
