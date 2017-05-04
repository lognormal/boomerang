/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/26-send-metric-not-exist", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent one beacon", function(done){
		t.ensureBeaconCount(done, 1);
	});

	it("Should have sent a regular page load beacon for the first beacon", function(){
		var b = tf.beacons[0];
		assert.isUndefined(b["http.initiator"]);
	});
});
