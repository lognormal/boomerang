/* eslint-env mocha */
/* global BOOMR_test,assert,angular */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["$", "jQuery", "Ember", "Em", "Handlebars", "ember_nav_routes", "html5_mode", "imgs", "App", "beaconNum", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "i"]);

describe("e2e/08-ember/27-route-change-back", function() {
  // use tests from #4
  BOOMR_test.templates.SPA["04-route-change"]();
});
