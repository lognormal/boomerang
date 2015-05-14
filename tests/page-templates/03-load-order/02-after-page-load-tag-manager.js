/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/03-load-order/02-after-page-load-tag-manager", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have a end timestamp equal to NavigationTiming's loadEventStart timestamp (if NavTiming supported)", function() {
		var b = tf.lastBeacon();
		if (window.performance && window.performance.timing) {
			assert.equal(b["rt.end"], window.performance.timing.loadEventStart);
		}
	});

	it("Should have a end timestamp after the loader start timestamp (if NavTiming not supported)", function() {
		var b = tf.lastBeacon();
		if (!(window.performance && window.performance.timing)) {
			assert.operator(b["rt.end"], ">=", BOOMR.t_lstart);
		}
	});

	it("Should have a end timestamp before the Boomerang start timestamp (if NavTiming not supported)", function() {
		var b = tf.lastBeacon();
		if (!(window.performance && window.performance.timing)) {
			assert.operator(b["rt.end"], "<=", BOOMR.t_start);
		}
	});

	it("Should have a end timestamp before now (if NavTiming not supported)", function() {
		var b = tf.lastBeacon();
		var now = +(new Date());
		if (!(window.performance && window.performance.timing)) {
			assert.operator(b["rt.end"], "<=", now);
		}
	});

	it("Should have a end timestamp equal to BOOMR.t_onload (if NavTiming not supported)", function() {
		var b = tf.lastBeacon();
		if (!(window.performance && window.performance.timing)) {
			assert.equal(b["rt.end"], BOOMR.t_onload);
		}
	});
});
