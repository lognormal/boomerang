/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/111096-2", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon (if ResourceTiming is enabled)", function() {
		if (t.isResourceTimingSupported()) {
			assert.notEqual(null, t.findResourceTimingBeacon());
		}
	});

	it("Should have called window.orig_XMLHttpRequest instead of window.XMLHttpRequest", function() {
		assert.equal(1, window.origXhrCalled);
	});
});
