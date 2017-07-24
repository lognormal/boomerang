/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,describe,it,assert*/

describe("e2e/04-page-params/29-resource-groups-custom-start", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have the custom timer 1 - With a duration of 2s since measuring from start of page (1s timeout + 1s fetch)", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT1"], "ctim.CT1 - Does not exist on the beacon!");
			if (t.isResourceTimingSupported() && t.isNavigationTimingSupported()) {
				var resource = t.findFirstResource("/delay?delay=1000&id=zzz&file=/pages/04-page-params/support/img.jpg");
				assert.closeTo(parseInt(timers["ctim.CT1"]), Math.round(resource.responseEnd), 1);
			}
			else {
				assert.closeTo(parseInt(timers["ctim.CT1"]), 2000, 100);
			}
		}
	});
});

