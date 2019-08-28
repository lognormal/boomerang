/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/25-orn", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent the log (c.l)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.l"]);
	});

	it("Should have logged the correct orientation events (c.l)", function() {
		var b = tf.lastBeacon();

		var logs = BOOMR.plugins.Continuity.decompressLog(b["c.l"]).filter(function(obj) {
			// LOG_TYPE_ORN === 5
			return obj.type === 5;
		});

		assert.equal(logs.length, 3);

		assert.equal(parseInt(logs[0].a, 36), 0);
		assert.equal(parseInt(logs[1].a, 36), 90);
		assert.equal(parseInt(logs[2].a, 36), -90);
	});
});
