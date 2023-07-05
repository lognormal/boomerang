/* eslint-env mocha */
/* global BOOMR_test */

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

describe("e2e/09-backbone/07-soft-nav-resources", function() {
  BOOMR_test.templates.SPA["07-soft-nav-resources"]();
});
