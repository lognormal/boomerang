/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["imgs", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2"]);

describe("e2e/12-react/10-autoxhr-overlapping", function() {
  BOOMR_test.templates.SPA["10-autoxhr-overlapping"]();
});
