/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,describe,it,assert*/

describe("e2e/04-page-params/30-resource-groups-custom-start", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have the custom timer 1 - QSA - With a duration of 2s since measuring from start of page (1s timeout + 1s fetch)", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT1"], "ctim.CT1 - Does not exist on the beacon!");
			var resource = t.findFirstResource("id=zzz");
			assert.closeTo(parseInt(timers["ctim.CT1"]), Math.round(resource.responseEnd), 1);
			assert.equal(b["ctim.CT1_st"], 0);
		}
		else {
			// TODO: we should check the value since it may exist even if RT is not supported
			this.skip();
		}
	});

	it("Should have the custom timer 2 - QSA - With a duration of 1s since measuring from start of first resource (1s fetch)", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT2"], "ctim.CT2 - Does not exist on the beacon!");
			var resource = t.findFirstResource("id=zzz");
			assert.closeTo(parseInt(timers["ctim.CT2"]), Math.round(resource.duration), 1);
			assert.operator(b["ctim.CT2_st"], ">", 0);
		}
		else {
			// TODO: we should check the value since it may exist even if RT is not supported
			this.skip();
		}
	});

	it("Should have the custom timer 3 - ResourceTiming - With a duration of 2s since measuring from start of page (1s timeout + 1s fetch)", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT3"], "ctim.CT3 - Does not exist on the beacon!");
			var resource = t.findFirstResource("id=zzz");
			assert.closeTo(parseInt(timers["ctim.CT3"]), Math.round(resource.responseEnd), 1);
			assert.equal(b["ctim.CT3_st"], 0);
		}
		else {
			this.skip();
		}
	});

	it("Should have the custom timer 4 - ResourceTiming - With a duration of 1s since measuring from start of first resource (1s fetch)", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT4"], "ctim.CT4 - Does not exist on the beacon!");
			var resource = t.findFirstResource("id=zzz");
			assert.closeTo(parseInt(timers["ctim.CT4"]), Math.round(resource.duration), 1);
			assert.operator(b["ctim.CT4_st"], ">", 0);
		}
		else {
			this.skip();
		}
	});

	it("Should have the custom timer 5 - ResourceTiming *.jpg - With a duration of 5s since measuring the main resource from start of page (5s fetch)", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT5"], "ctim.CT5 - Does not exist on the beacon!");
			var resource = t.findFirstResource("id=yyy");
			if (t.isIE() || t.isEdge()) {
				// IE and Edge sometimes have RT entries without responseEnd set, we estimate the end time
				// See `updateResourceGroupDelta` in page-params
				assert.closeTo(parseInt(timers["ctim.CT5"]), Math.round(resource.responseEnd), 250);
			}
			else {
				assert.closeTo(parseInt(timers["ctim.CT5"]), Math.round(resource.responseEnd), 1);
			}
			assert.equal(b["ctim.CT5_st"], 0);
		}
		else {
			// TODO: we should check the value since it may exist even if RT is not supported
			this.skip();
		}
	});

	it("Should have the custom timer 6 - ResourceTiming *.jpg - With a duration of 5s since measuring the main resource from start of resource (5s fetch)", function() {
		if (t.isResourceTimingSupported()) {
			var b = tf.lastBeacon();
			var timers = t.parseTimers(b.t_other);
			assert.isDefined(timers["ctim.CT6"], "ctim.CT6 - Does not exist on the beacon!");
			var resource = t.findFirstResource("id=yyy");
			if (t.isIE() || t.isEdge()) {
				// IE and Edge sometimes have RT entries without responseEnd set, we estimate the end time
				// See `updateResourceGroupDelta` in page-params
				assert.closeTo(parseInt(timers["ctim.CT6"]), Math.round(resource.duration), 250);
			}
			else {
				assert.closeTo(parseInt(timers["ctim.CT6"]), Math.round(resource.duration), 1);
			}
			assert.operator(b["ctim.CT6_st"], ">", 0);
		}
		else {
			// TODO: we should check the value since it may exist even if RT is not supported
			this.skip();
		}
	});
});
