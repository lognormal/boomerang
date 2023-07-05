/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["BOOMR_script_delay", "angular", "ng339", "timestamp", "modules", "app", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2"]);

describe("e2e/05-angular/25-delayed-boomerang-pre-config-snippet", function() {
  BOOMR_test.templates.SPA["25-delayed-boomerang-pre-config-snippet"]();
});
