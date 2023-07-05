/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["ember_nav_routes", "html5_mode", "imgs", "$", "jQuery", "Ember", "Em", "Handlebars", "App", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "i"]);

describe("e2e/08-ember/07-soft-nav-resources", function() {
  BOOMR_test.templates.SPA["07-soft-nav-resources"]();
});
