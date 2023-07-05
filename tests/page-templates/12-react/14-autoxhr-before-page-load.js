/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["imgs", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2", "xhr"]);

describe("e2e/12-react/14-autoxhr-before-page-load", function() {
  BOOMR_test.templates.SPA["14-autoxhr-before-page-load"]();
});
