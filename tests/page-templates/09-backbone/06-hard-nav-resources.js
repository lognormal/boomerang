/*eslint-env mocha*/
/*global BOOMR_test*/

/*
* This app uses a delayed angular.bootstrap (and no ng-app)
* directive.
*/
describe("e2e/09-backbone/06-hard-nav-resources", function() {
	BOOMR_test.templates.SPA["06-hard-nav-resources"]();
});
