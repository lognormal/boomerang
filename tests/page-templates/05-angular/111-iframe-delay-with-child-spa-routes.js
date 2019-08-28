/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,describe,it*/

describe("e2e/05-angular/111-iframe-delay-with-child-spa-routes", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	function getIFrameBeacon(id) {
		return document.getElementById(id).contentWindow.BOOMR.plugins.TestFramework.lastBeacon();
	}

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have only sent one beacon", function() {
		// only one beacon should've been sent
		assert.equal(tf.beacons.length, 1);
	});

	it("Should have page_ready (pr) flag", function() {
		var b = tf.lastBeacon();
		assert.equal(b.pr, "1");
	});

	it("Should have ifdl.done param and be greater than the rt.end of the slowest iframe", function() {
		var b = tf.lastBeacon(), bf1 = getIFrameBeacon("frame1");
		assert.isDefined(b["ifdl.done"]);
		assert.operator(b["ifdl.done"], ">", bf1["rt.end"]);  // will be at least 1s more due to spa timeout delay
	});

	it("Should have ifdl.ct param", function() {
		var b = tf.lastBeacon();
		assert.equal(b["ifdl.ct"], "1");
	});

	it("Should have ifdl.r param", function() {
		var b = tf.lastBeacon();
		assert.equal(b["ifdl.r"], "0");
	});

	it("Should have ifdl.mon param", function() {
		var b = tf.lastBeacon();
		assert.equal(b["ifdl.mon"], "1");
	});

	it("Should have rt.end of the slowest iframe", function() {
		var b = tf.lastBeacon(), bf1 = getIFrameBeacon("frame1");
		assert.equal(b["rt.end"], bf1["rt.end"]);
	});
});

