/*eslint-env mocha*/
/*global BOOMR_test,assert,angular*/

describe("e2e/05-angular/101-angular-15-route-change", function() {
	// use tests from #4
	BOOMR_test.templates.SPA["04-route-change"]();

	it("Should be on version 1.5.x", function() {
		assert.equal(1, angular.version.major);
		assert.equal(5, angular.version.minor);
	});
});
