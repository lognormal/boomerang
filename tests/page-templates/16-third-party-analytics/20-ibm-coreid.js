/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/16-third-party-analytics/20-ibm-coreid", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have IBM Analytics Core ID", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ia.coreid"], "80031460041999083951624");
	});
});
