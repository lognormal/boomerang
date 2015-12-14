/*eslint-env mocha*/
/*global BOOMR_test,assert,BOOMR*/

describe("e2e/06-bugs/100343", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should have sent one beacon", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done,  1);
	});

	it("The beacon URL should not have sent to blackhole2 (if ResourceTiming is enabled)", function() {
		if (t.isResourceTimingSupported) {
			// Note only IE logs 404s.  Chrome currently does not.
			assert.equal(null, t.findFirstResource("blackhole2"));
		}
	});
});
