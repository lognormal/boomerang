/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/03-load-order/01-after-page-load", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should contain BOOMR.url set to boomerang's URL", function() {
		assert.isString(BOOMR.url, "is not a string");
		assert.match(BOOMR.url, /\/boomerang-latest-debug.js($|\?)/, "does not match: " + BOOMR.url);
	});

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

	it("Should have a end timestamp equal to NavigationTiming's loadEventEnd timestamp (if NavTiming supported)", function() {
		var b = tf.lastBeacon();
		if (window.performance && window.performance.timing) {
			assert.equal(b["rt.end"], window.performance.timing.loadEventEnd);
		}
		else {
			return this.skip();
		}
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
});
