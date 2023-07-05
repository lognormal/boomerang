/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["angular", "ng339", "modules", "app", "angular_html5_mode", "angular_nav_routes", "angular_imgs", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "i"]);

describe("e2e/05-angular/20-no-resources", function() {
  BOOMR_test.templates.SPA["20-no-resources"]();
});
