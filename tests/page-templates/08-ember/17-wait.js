/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["$", "jQuery", "Ember", "Em", "Handlebars", "routeWaits", "routeNumber", "imgs", "html5_mode", "ember_nav_routes", "spaWaitCompleteTimes", "ember_route_wait", "App", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "i"]);

describe("e2e/08-ember/17-wait", function() {
  BOOMR_test.templates.SPA["17-wait"]();
});
