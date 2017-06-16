/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/29-send-timer-pagegroup", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent two beacons", function(done){
		t.ensureBeaconCount(done, 2);
	});

	it("Should have sent a regular page load beacon for the first beacon", function(){
		var b = tf.beacons[0];
		assert.isUndefined(b["http.initiator"]);
	});

	it("Should have set the Custom Timer on the second beacon", function(){
		var b = tf.lastBeacon();
		assert.include(b.t_other, "custom1|111");
	});

	it("Should have set the Page Group on the second beacon", function(){
		var b = tf.lastBeacon();
		assert.equal(b["h.pg"], "PG");
	});
});
