/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/111096-1", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon (if ResourceTiming is enabled)", function() {
		if (t.isResourceTimingSupported()) {
			assert.notEqual(null, t.findResourceTimingBeacon());
		}
	});
});
