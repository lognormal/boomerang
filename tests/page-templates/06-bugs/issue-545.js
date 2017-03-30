/*eslint-env mocha*/
/*global assert,it,describe*/

describe("e2e/06-bugs/issue-545", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should get 1 beacon: 1 onload", function(done) {
		t.ensureBeaconCount(done, 1);
	});

	it("Should use Date.now if window.performance.now was a bogus function", function() {
		if (typeof Date.now === "function") {
			assert.equal(Date.now, BOOMR.now);
		}
	});
});
