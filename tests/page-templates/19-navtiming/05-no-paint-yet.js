/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/19-navtiming/05-no-paint-yet", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should not have called chrome.loadTimes() even if no paint has happened yet", function() {
		assert.isFalse(window.loadTimesCalled, "chrome.loadTimes() should not be called");
	});

});
