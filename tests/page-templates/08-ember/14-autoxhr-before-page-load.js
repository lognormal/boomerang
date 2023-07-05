/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["$", "jQuery", "Ember", "Em", "Handlebars", "App", "xhr", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2"]);

describe("e2e/08-ember/14-autoxhr-before-page-load", function() {
  BOOMR_test.templates.SPA["14-autoxhr-before-page-load"]();
});
