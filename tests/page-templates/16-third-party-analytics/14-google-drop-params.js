/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/16-third-party-analytics/14-google-drop-params", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should not have Google Analytics Client ID", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ga.clientid"], undefined);
	});

	it("Should have Google campaign source set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ga.utm_source"], "source");
	});

	it("Should have Google campaign medium set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ga.utm_medium"], "medium");
	});

	it("Should not have Google campaign term set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ga.utm_term"], undefined);
	});

	it("Should not have Google campaign content set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ga.utm_content"], undefined);
	});

	it("Should have Google campaign campaign set", function() {
		var b = tf.lastBeacon();
		assert.equal(b["tp.ga.utm_campaign"], "campaign");
	});
});
