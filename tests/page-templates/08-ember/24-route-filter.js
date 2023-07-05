/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["$", "jQuery", "Ember", "Em", "Handlebars", "navs", "html5_mode", "imgs", "ember_nav_routes", "ember_route_filter", "App", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "i"]);

describe("e2e/08-ember/24-route-filter", function() {
  BOOMR_test.templates.SPA["24-route-filter"]();
});
