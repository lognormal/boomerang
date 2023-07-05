/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["$", "jQuery", "Ember", "Em", "Handlebars", "ember_nav_routes", "html5_mode", "imgs", "App", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "i"]);

describe("e2e/08-ember/05-route-change-hashtags", function() {
  BOOMR_test.templates.SPA["05-route-change-hashtags"]();
});
