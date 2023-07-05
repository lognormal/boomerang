/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, [
  "$",
  "jQuery",
  "Handlebars",
  "Backbone",
  "app",
  "Widgets",
  "AppRouter",
  "hookOptions",
  "hadRouteChange",
  "hookBackboneBoomerang",
  "backbone_start",
  "xhr",
  "beaconNum",
  "backbone_imgs",
  "custom_metric_1",
  "custom_metric_2",
  "custom_timer_1",
  "custom_timer_2"
]);

describe("e2e/09-backbone/16-autoxhr-after-load-with-mutation", function() {
  BOOMR_test.templates.SPA["16-autoxhr-after-load-with-mutation"]();
});
