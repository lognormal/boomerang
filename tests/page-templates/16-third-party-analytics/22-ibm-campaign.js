/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/16-third-party-analytics/22-ibm-campaign", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have IBM campaign vendor set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ia.mmc_vendor"], "vendor");
	});

	it("Should have IBM campaign category set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ia.mmc_category"], "category");
	});

	it("Should have IBM campaign placement set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ia.mmc_placement"], "placement");
	});

	it("Should have IBM campaign item set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ia.mmc_item"], "item");
	});
});
