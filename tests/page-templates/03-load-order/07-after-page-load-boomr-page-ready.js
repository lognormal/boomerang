/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/03-load-order/07-after-page-load-boomr-page-ready", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have a start timestamp equal to NavigationTiming's navigationStart timestamp (if NavTiming supported)", function() {
		var b = tf.lastBeacon();
		if (window.performance && window.performance.timing) {
			assert.equal(b["rt.tstart"], window.performance.timing.navigationStart);
		}
		else {
			return this.skip();
		}
	});

	it("Should have an empty rt.tstart (if NavTiming not supported)", function() {
		var b = tf.lastBeacon();
		if (!(window.performance && window.performance.timing)) {
			assert.isUndefined(b["rt.tstart"]);
		}
		else {
			return this.skip();
		}
	});

	it("Should have a end timestamp equal to our simulated page ready timestamp", function() {
		var b = tf.lastBeacon();
		assert.equal(b["rt.end"], window.pageReadyTs);
	});

	it("Should have a end timestamp sometime in the last hour (if NavTiming not supported)", function() {
		var b = tf.lastBeacon();
		var now = +(new Date());
		if (!(window.performance && window.performance.timing)) {
			assert.operator(b["rt.end"], ">=", now - 3600000);
			assert.operator(b["rt.end"], "<=", now);
		}
		else {
			return this.skip();
		}
	});

	it("Should be a 'navigation' (if NavTiming supported)", function() {
		var b = tf.lastBeacon();
		if (window.performance && window.performance.timing) {
			assert.equal(b["rt.start"], "navigation");
		}
		else {
			return this.skip();
		}
	});

	it("Should be a 'none' (if NavTiming not supported)", function() {
		var b = tf.lastBeacon();
		if (!(window.performance && window.performance.timing)) {
			assert.equal(b["rt.start"], "none");
		}
		else {
			return this.skip();
		}
	});

	it("Should have set pr=1", function() {
		var b = tf.lastBeacon();

		assert.equal(b.pr, "1");
	});
});
