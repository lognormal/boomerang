/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,describe,it*/

describe("e2e/05-angular/109-multiple-iframes", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	function getIFrameBeacon(id) {
		return document.getElementById(id).contentWindow.BOOMR.plugins.TestFramework.lastBeacon();
	}

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have only sent one beacon", function(done) {
		// only one beacon should've been sent
		t.ensureBeaconCount(done, 1);
	});

	it("Should have page_ready (pr) flag", function() {
		var b = tf.lastBeacon();
		assert.equal(b.pr, "1");
	});

	it("Should have ifdl.done param and be greater than the rt.end of the slowest iframe", function() {
		var b = tf.lastBeacon(), bf1 = getIFrameBeacon("frame1"), bf2 = getIFrameBeacon("frame2");
		assert.isDefined(b["ifdl.done"]);
		var loadEnd = Math.max(bf1["rt.end"], bf2["rt.end"]);
		assert.operator(b["ifdl.done"], ">", loadEnd);  // will be at least 1s more due to spa timeout delay
	});

	it("Should have ifdl.ct param", function() {
		var b = tf.lastBeacon();
		assert.equal(b["ifdl.ct"], "2");
	});

	it("Should have ifdl.r param", function() {
		var b = tf.lastBeacon();
		assert.equal(b["ifdl.r"], "0");
	});

	it("Should have ifdl.mon param", function() {
		var b = tf.lastBeacon();
		assert.equal(b["ifdl.mon"], "2");
	});

	it("Should have rt.end of the slowest iframe", function() {
		var b = tf.lastBeacon(), bf1 = getIFrameBeacon("frame1"), bf2 = getIFrameBeacon("frame2");
		var loadEnd = Math.max(bf1["rt.end"], bf2["rt.end"]);
		assert.equal(b["rt.end"], loadEnd);
	});
});

