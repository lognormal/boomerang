/* eslint-env mocha */

/*
* This app uses a delayed angular.bootstrap (and no ng-app)
* directive.
*/
// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, [
  "$",
  "jQuery",
  "Handlebars",
  "Backbone",
  "backbone_imgs",
  "backbone_delay_startup",
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

describe("e2e/09-backbone/00-simple", function() {
  BOOMR_test.templates.SPA["00-simple"]();
});
