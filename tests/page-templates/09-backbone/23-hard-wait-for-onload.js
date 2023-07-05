/* eslint-env mocha */

// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["$", "jQuery", "Handlebars", "Backbone", "backbone_imgs", "app", "Widgets", "AppRouter", "hookOptions", "hadRouteChange", "hookBackboneBoomerang", "backbone_start", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2"]);

describe("e2e/09-backbone/23-hard-wait-for-onload", function() {
  BOOMR_test.templates.SPA["23-hard-wait-for-onload"]();
});
