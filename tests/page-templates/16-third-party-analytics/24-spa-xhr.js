/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/16-third-party-analytics/24-spa-xhr", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent 2 beacons", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 2);
	});

	describe("Beacon 1 (spa_hard)", function() {
		var i = 0;
		it("Should be a spa_hard beacon", function() {
			var b = tf.beacons[i];
			assert.equal(b["http.initiator"], "spa_hard");
		});

		it("Should have Google campaign source set", function() {
			var b = tf.beacons[i];
			assert.equal(b["tp.ga.utm_source"], "source");
		});

		it("Should have Google campaign medium set", function() {
			var b = tf.beacons[i];
			assert.equal(b["tp.ga.utm_medium"], "medium");
		});

		it("Should have Google campaign term set", function() {
			var b = tf.beacons[i];
			assert.equal(b["tp.ga.utm_term"], "term");
		});

		it("Should have Google campaign content set", function() {
			var b = tf.beacons[i];
			assert.equal(b["tp.ga.utm_content"], "content");
		});

		it("Should have Google campaign campaign set", function() {
			var b = tf.beacons[i];
			assert.equal(b["tp.ga.utm_campaign"], "campaign");
		});
	});

	describe("Beacon 2 (xhr)", function() {
		var i = 1;
		it("Should be a xhr beacon", function() {
			var b = tf.beacons[i];
			assert.equal(b["http.initiator"], "xhr");
		});

		it("Should not have any TPAnalytics params set", function() {
			var k, b = tf.beacons[i];
			for (k in b) {
				assert.isFalse(/^tp\./.test(b[k]));
			}
		});
	});
});
