/*eslint-env mocha*/
/*global BOOMR_test,assert,BOOMR*/

describe("e2e/10-config-override/02-rt-cookie", function() {

	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have set BOOMR cookie", function() {
		assert.isTrue(document.cookie.indexOf("BOOMR=") !== -1);
	});

	it("Should have not set the RT cookie", function() {
		assert.isTrue(document.cookie.indexOf("RT=") === -1);
	});
});
