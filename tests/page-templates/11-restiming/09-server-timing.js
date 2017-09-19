/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/11-restiming/09-server-timing", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should pass basic beacon validation", function(done){
		t.validateBeaconWasSent(done);
	});

	it("Should have optimized server timing entries as `servertiming`", function() {
		if (!t.isServerTimingSupported()) {
			return;
		}

		// because of other potential server timing entries in the page (express-middleware-server-timing),
		// we can't do an exact equality check
		var b = tf.beacons[0];
		assert.match(b.servertiming,
			/~\(~'metric1~'for\*20spacer.gif~'for\*2009-server-timing.html~'for\*20st-iframe.html\)~\(~'metric3~'for\*20spacer.gif\)~\(~'metric2~'for\*2009-server-timing.html\)~\(~'metric4~'for\*20st-iframe.html\)/);
	});

	it("Should have server timing data on `restiming`", function() {
		if (!t.isServerTimingSupported()) {
			return;
		}
		var b = tf.beacons[0];
		var hasMiddlewareEntry = typeof performance.getEntriesByType("navigation")[0].serverTiming.find(function(e) {
			return (e.name || e.metric) === "mw";
		}) !== "undefined";
		assert.match(b.restiming, !hasMiddlewareEntry ? /\*31:.1,2:2/ : /\*31:1.1,2:3/);
		assert.match(b.restiming, !hasMiddlewareEntry ? /\*31:.2,4:3/ : /\*31:1.2,4:4/);
		assert.lengthOf(b.restiming.match(!hasMiddlewareEntry ? /\*31,3:1/g : /\*31:1,3:2/g), 2); // should match twice
	});

});
