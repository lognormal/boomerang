/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["angular", "ng339", "modules", "app", "angular_imgs", "angular_nav_routes", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "i"]);

describe("e2e/05-angular/19-autoxhr-during-nav-alwayssendxhr", function() {
  BOOMR_test.templates.SPA["19-autoxhr-during-nav-alwayssendxhr"]();
});
