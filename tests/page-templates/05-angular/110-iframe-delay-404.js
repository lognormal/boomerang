/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,describe,it*/

describe("e2e/05-angular/110-iframe-delay-404", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have only sent one beacon", function() {
		// only one beacon should've been sent
		assert.equal(tf.beacons.length, 1);
	});

	it("Should have finished 0 iframes (as the single iframe failed load)", function() {
		var b = tf.lastBeacon();
		assert.equal(b["ifdl.ct"], 0);
	});

	it("Should have 0 monitored iframe on the beacon as the monitored count reduced to the actually registered 0 frames", function() {
		var b = tf.lastBeacon();
		assert.equal(b["ifdl.mon"], 0);
	});

	it("Should have 0 running iframe on the beacon as our initial iframe failed to load", function() {
		var b = tf.lastBeacon();
		assert.equal(b["ifdl.r"], 0);
	});
});
