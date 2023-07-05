/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2"]);

describe("e2e/12-react/21-constant-mutations", function() {
  BOOMR_test.templates.SPA["21-constant-mutations"]();
});
