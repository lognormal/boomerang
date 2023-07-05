/* eslint-env mocha */
/* global BOOMR_test */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["$", "jQuery", "Handlebars", "Backbone", "app", "Widgets", "AppRouter", "hookOptions", "hadRouteChange", "hookBackboneBoomerang", "backbone_start", "backbone_imgs", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2"]);

describe("e2e/09-backbone/11-autoxhr-trigger-additional", function() {
  BOOMR_test.templates.SPA["11-autoxhr-trigger-additional"]();
});
