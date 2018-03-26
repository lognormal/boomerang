/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/21-continuity/24-vis", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent a single beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent the log (c.l)", function() {
		var b = tf.lastBeacon();

		assert.isDefined(b["c.l"]);
	});

	it("Should have logged the correct visibility events (c.l)", function() {
		var b = tf.lastBeacon();

		var logs = BOOMR.plugins.Continuity.decompressLog(b["c.l"]).filter(function(obj) {
			// LOG_TYPE_VIS === 4
			return obj.type === 4;
		});

		assert.equal(logs.length, 4);

		// prerender
		assert.equal(logs[0].s, 2);

		// visible
		assert.equal(logs[1].s, 0);

		// hidden
		assert.equal(logs[2].s, 1);

		// visible
		assert.equal(logs[3].s, 0);
	});
});
