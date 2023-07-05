/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["angular", "ng339", "modules", "app", "xhr", "beaconNum", "angular_imgs", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2"]);

describe("e2e/05-angular/09-autoxhr-after-load", function() {
  BOOMR_test.templates.SPA["09-autoxhr-after-load"]();
});
