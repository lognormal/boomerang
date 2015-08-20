/*eslint-env mocha*/
/*global BOOMR_test*/

/*
* This app uses a delayed angular.bootstrap (and no ng-app)
* directive.
*/
describe("e2e/05-angular/02-custom-timers", function() {
	BOOMR_test.templates.SPA["02-custom-timers"]();
});
