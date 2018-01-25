/*eslint-env mocha*/
/*global BOOMR_test,assert,BOOMR*/

describe("e2e/10-config-override/04-beacon-urls-not-allowed", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have not sent a beacon (after waiting 5 seconds)", function(done) {
		this.timeout(10000);
		setTimeout(function() {
			assert.equal(0, BOOMR.plugins.TestFramework.beacons.length);
			done();
		}, 5000);
	});
});
