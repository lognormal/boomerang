/* eslint-env mocha */
/* global BOOMR_test */

/*
* This app uses a delayed angular.bootstrap (and no ng-app)
* directive.
*/
// globals from this test
Array.prototype.push.apply(BOOMR_test.addedGlobals, ["angular", "ng339", "modules", "app", "angular_imgs", "custom_metric_1", "custom_metric_2", "custom_timer_1", "custom_timer_2"]);

describe("e2e/05-angular/06-hard-nav-resources", function() {
  BOOMR_test.templates.SPA["06-hard-nav-resources"]();
});
