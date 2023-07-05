/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["BOOMR_script_delay", "$", "jQuery", "Ember", "Em", "Handlebars", "App", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2"]);

describe("e2e/08-ember/15-delayed-boomerang", function() {
  BOOMR_test.templates.SPA["15-delayed-boomerang"]();
});
