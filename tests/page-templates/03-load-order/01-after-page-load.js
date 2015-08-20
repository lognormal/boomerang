/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/03-load-order/01-after-page-load", function() {
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
	});

	it("Should have an empty rt.tstart (if NavTiming not supported)", function() {
		var b = tf.lastBeacon();
		if (!(window.performance && window.performance.timing)) {
			assert.isUndefined(b["rt.tstart"]);
		}
	});

	it("Should have a end timestamp equal to NavigationTiming's loadEventStart timestamp (if NavTiming supported)", function() {
		var b = tf.lastBeacon();
		if (window.performance && window.performance.timing) {
			assert.equal(b["rt.end"], window.performance.timing.loadEventStart);
		}
	});

	it("Should have a end timestamp sometime in the last hour (if NavTiming not supported)", function() {
		var b = tf.lastBeacon();
		var now = +(new Date());
		if (!(window.performance && window.performance.timing)) {
			assert.operator(b["rt.end"], ">=", now - 3600000);
			assert.operator(b["rt.end"], "<=", now);
		}
	});

	it("Should be a 'navigation' (if NavTiming supported)", function() {
		var b = tf.lastBeacon();
		if (window.performance && window.performance.timing) {
			assert.equal(b["rt.start"], "navigation");
		}
	});

	it("Should be a 'none' (if NavTiming not supported)", function() {
		var b = tf.lastBeacon();
		if (!(window.performance && window.performance.timing)) {
			assert.equal(b["rt.start"], "none");
		}
	});
});
