/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["29-route-change-early-beacon"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	var pathName = window.location.pathname;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent six beacons", function() {
		assert.equal(tf.beacons.length, 6);
	});

	it("Should have sent the first two beacons as http.initiator = spa_hard", function() {
		for (var i = 0; i < 2; i++) {
			assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
		}
	});

	it("Should have sent all subsequent beacons as http.initiator = spa", function() {
		for (var i = 2; i < 5; i++) {
			assert.equal(tf.beacons[i]["http.initiator"], "spa");
		}
	});

	it("Should have sent rt.nstart = navigationTiming (if NavigationTiming is supported) on all SPA soft beacons", function() {
		if (typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			for (var i = 2; i < 5; i++) {
				assert.equal(tf.beacons[i]["rt.nstart"], BOOMR.plugins.RT.navigationStart());
			}
		}
		else {
			this.skip();
		}
	});

	it("Should have set the same Page ID (pid) on all beacons", function() {
		var pid = BOOMR.pageId;
		for (var i = 0; i <= 5; i++) {
			var b = tf.beacons[i];
			assert.equal(b.pid, pid);
		}
	});

	it("Should not have Boomerang timings on SPA Soft beacons", function() {
		for (var i = 2; i < 5; i++) {
			if (tf.beacons[i].t_other) {
				assert.equal(tf.beacons[i].t_other.indexOf("boomr_fb"), -1, "should not have boomr_fb on beacon " + (i + 1));
				assert.equal(tf.beacons[i].t_other.indexOf("boomr_ld"), -1, "should not have boomr_ld on beacon " + (i + 1));
				assert.equal(tf.beacons[i].t_other.indexOf("boomr_lat"), -1, "should not have boomr_lat on beacon " + (i + 1));
				assert.equal(tf.beacons[i].t_other.indexOf("boomerang"), -1, "should not have boomerang on beacon " + (i + 1));
			}

			// Boomerang and config timing parameters
			assert.isUndefined(tf.beacons[i]["rt.bmr"], "should not have rt.bmr on beacon " + (i + 1));
			assert.isUndefined(tf.beacons[i]["rt.cnf"], "should not have rt.cnf on beacon " + (i + 1));
		}
	});

	//
	// Beacon 1
	//
	describe("Beacon 1 (spa_hard early)", function() {
		var i = 0;

		it("Should pass early beacon validation", function() {
			t.validateEarlyBeacon(tf.beacons[i], tf.beacons[i + 1]);
		});

		it("Should have custom metric 1 - JavaScript var", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet1, 11);
		});

		it("Should have custom metric 2 - JavaScript function", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet2, 22);
		});

		it("Should be missing custom metric 3 - undefined JavaScript var", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet3, undefined);
		});

		it("Should have the custom metric 4 - XPath", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet4, 444.44);
		});

		it("Should have the custom metric 5 - URL", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet5, 1);
		});

		it("Should be missing the custom timer 0 - NavigationTiming - because it's handled on the server", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom0);
		});

		it("Should have the custom timer 1 - JavaScript variable - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom1, 11);
		});

		it("Should have the custom timer 2 - JavaScript function - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom2, 22);
		});

		it("Should have the custom timer 3 - UserTiming (if UserTiming is supported)", function() {
			if (t.isUserTimingSupported()) {
				var b = tf.beacons[i];
				assert.isTrue(t.parseTimers(b.t_other).custom3 > 0);
			}
			else {
				this.skip();
			}
		});

		it("Should be missing the custom timer 3 - UserTiming (if UserTiming is not supported)", function() {
			if (!t.isUserTimingSupported()) {
				var b = tf.beacons[i];
				assert.isUndefined(t.parseTimers(b.t_other).custom3);
			}
			else {
				this.skip();
			}
		});

		it("Should be missing custom timer 4 - JavaScript var", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom4);
		});

		it("Should be missing custom timer 5 - UserTiming", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom5);
		});
	});

	//
	// Beacon 2
	//
	describe("Beacon 2 (spa_hard)", function() {
		var i = 1;
		it("Should have sent http.initiator = spa_hard", function() {
			assert.equal(tf.beacons[i]["http.initiator"], "spa_hard");
		});

		it("Should have sent the beacon for " + pathName, function() {
			var b = tf.beacons[i];
			assert.isTrue(b.u.indexOf(pathName) !== -1);
		});

		it("Should take as long as the longest img load (if MutationObserver and NavigationTiming are supported)", function() {
			if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
				t.validateBeaconWasSentAfter(i, "img.jpg&id=home", 500, 3000, 30000, 0);
			}
			else {
				this.skip();
			}
		});

		it("Should not have a load time (if MutationObserver is supported but NavigationTiming is not)", function() {
			if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
				var b = tf.beacons[i];
				assert.equal(b.t_done, undefined);
			}
			else {
				this.skip();
			}
		});

		it("Should take as long as the XHRs (if MutationObserver is not supported but NavigationTiming is)", function() {
			if (!t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
				t.validateBeaconWasSentAfter(i, "widgets.json", 500, 0, 30000, false);
			}
			else {
				this.skip();
			}
		});

		it("Shouldn't have a load time (if MutationObserver and NavigationTiming are not supported)", function() {
			if (!t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
				var b = tf.beacons[i];
				assert.equal(b.t_done, undefined);
				assert.equal(b["rt.start"], "none");
			}
			else {
				this.skip();
			}
		});

		it("Should have a t_resp of the root page (if MutationObserver and NavigationTiming are supported)", function() {
			if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
				var pt = window.performance.timing;
				var b = tf.beacons[i];
				assert.equal(b.t_resp, pt.responseStart - pt.navigationStart);
			}
			else {
				this.skip();
			}
		});

		it("Should have a t_page of total - t_resp (if MutationObserver and NavigationTiming are supported)", function() {
			if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
				var pt = window.performance.timing;
				var b = tf.beacons[i];
				assert.equal(b.t_page, b.t_done - b.t_resp);
			}
			else {
				this.skip();
			}
		});

		it("Should have custom metric 1 - JavaScript var - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet1, 11);
		});

		it("Should have custom metric 2 - JavaScript function - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet2, 22);
		});

		it("Should be missing custom metric 3 - undefined JavaScript var", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet3, undefined);
		});

		it("Should have the custom metric 4 - XPath", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet4, 444.44);
		});

		it("Should have the custom metric 5 - URL", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet5, 1);
		});

		it("Should be missing the custom timer 0 - NavigationTiming - because it's handled on the server", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom0);
		});

		it("Should have the custom timer 1 - JavaScript variable - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom1, 11);
		});

		it("Should have the custom timer 2 - JavaScript function - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom2, 22);
		});

		it("Should have the custom timer 3 - UserTiming (if UserTiming is supported)", function() {
			if (t.isUserTimingSupported()) {
				var b = tf.beacons[i];
				assert.isTrue(t.parseTimers(b.t_other).custom3 > 0);
			}
			else {
				this.skip();
			}
		});

		it("Should be missing the custom timer 3 - UserTiming (if UserTiming is not supported)", function() {
			if (!t.isUserTimingSupported()) {
				var b = tf.beacons[i];
				assert.isUndefined(t.parseTimers(b.t_other).custom3);
			}
			else {
				this.skip();
			}
		});

		it("Should be missing custom timer 4 - JavaScript var", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom4);
		});

		it("Should be missing custom timer 5 - UserTiming", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom5);
		});
	});

	//
	// Beacon 3
	//
	describe("Beacon 3 (spa early)", function() {
		var i = 2;

		it("Should pass early beacon validation", function() {
			t.validateEarlyBeacon(tf.beacons[i], tf.beacons[i + 1]);
		});

		it("Should have custom metric 1 - JavaScript var - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet1, 1);
		});

		it("Should have custom metric 2 - JavaScript function - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet2, 10);
		});

		it("Should be missing custom metric 3 - undefined JavaScript var", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet3, undefined);
		});

		it("Should have the custom metric 4 - XPath", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet4, 11.11);
		});

		it("Should have the custom metric 5 - URL", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet5, 1);
		});

		it("Should be missing the custom timer 0 - NavigationTiming - because it's handled on the server", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom0);
		});

		it("Should have the custom timer 1 - JavaScript variable - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom1, 1);
		});

		it("Should have the custom timer 2 - JavaScript function - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom2, 10);
		});

		it("Should have the custom timer 3 - UserTiming (if UserTiming is supported)", function() {
			if (t.isUserTimingSupported()) {
				var b = tf.beacons[i];
				assert.isTrue(t.parseTimers(b.t_other).custom3 > 0);
			}
			else {
				this.skip();
			}
		});

		it("Should be missing the custom timer 3 - UserTiming (if UserTiming is not supported)", function() {
			if (!t.isUserTimingSupported()) {
				var b = tf.beacons[i];
				assert.isUndefined(t.parseTimers(b.t_other).custom3);
			}
			else {
				this.skip();
			}
		});

		it("Should be missing custom timer 4 - JavaScript var", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom4);
		});

		it("Should be missing custom timer 5 - UserTiming", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom5);
		});
	});

	//
	// Beacon 4
	//
	describe("Beacon 4 (spa)", function() {
		var i = 3;
		it("Should have sent the beacon for /widgets/1", function() {
			var b = tf.beacons[i];
			assert.isTrue(b.u.indexOf("/widgets/1") !== -1);
		});

		it("Should have sent the beacon with a timestamp of at least 1 second (if MutationObserver is supported)", function() {
			if (t.isMutationObserverSupported()) {
				// because of the widget IMG delaying 1 second
				var b = tf.beacons[i];
				assert.operator(b.t_done, ">=", 1000);
			}
			else {
				this.skip();
			}
		});

		it("Should have sent the beacon with a timestamp of at least 1 millisecond (if MutationObserver is not supported)", function() {
			if (!t.isMutationObserverSupported()) {
				// because of the widget IMG delaying 1 second but we couldn't track it because no MO support
				var b = tf.beacons[i];
				assert.operator(b.t_done, ">=", 0);
			}
			else {
				this.skip();
			}
		});

		it("Should have sent the beacon with a t_resp value (if MutationObserver and ResourceTiming are supported)", function() {
			if (t.isMutationObserverSupported() && t.isResourceTimingSupported()) {
				var b = tf.beacons[i];

				assert.operator(b.t_resp, ">=", 0);
			}
			else {
				this.skip();
			}
		});

		it("Should have sent the beacon with a t_page of total - t_resp (if MutationObserver and ResourceTiming are supported)", function() {
			if (t.isMutationObserverSupported() && t.isResourceTimingSupported()) {
				var b = tf.beacons[i];
				assert.equal(b.t_page, b.t_done - b.t_resp);
			}
			else {
				this.skip();
			}
		});

		it("Should have custom metric 1 - JavaScript var - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet1, 1);
		});

		it("Should have custom metric 2 - JavaScript function - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet2, 10);
		});

		it("Should be missing custom metric 3 - undefined JavaScript var", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet3, undefined);
		});

		it("Should have the custom metric 4 - XPath", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet4, 11.11);
		});

		it("Should have the custom metric 5 - URL", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet5, 1);
		});

		it("Should be missing the custom timer 0 - NavigationTiming - because it's handled on the server", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom0);
		});

		it("Should have the custom timer 1 - JavaScript variable - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom1, 1);
		});

		it("Should have the custom timer 2 - JavaScript function - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom2, 10);
		});

		it("Should have the custom timer 3 - UserTiming (if UserTiming is supported)", function() {
			if (t.isUserTimingSupported()) {
				var b = tf.beacons[i];
				assert.isTrue(t.parseTimers(b.t_other).custom3 > 0);
			}
			else {
				this.skip();
			}
		});

		it("Should be missing the custom timer 3 - UserTiming (if UserTiming is not supported)", function() {
			if (!t.isUserTimingSupported()) {
				var b = tf.beacons[i];
				assert.isUndefined(t.parseTimers(b.t_other).custom3);
			}
			else {
				this.skip();
			}
		});

		it("Should be missing custom timer 4 - JavaScript var", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom4);
		});

		it("Should be missing custom timer 5 - UserTiming", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom5);
		});
	});

	//
	// Beacon 5
	//
	describe("Beacon 5 (spa early)", function() {
		var i = 4;

		it("Should pass early beacon validation", function() {
			t.validateEarlyBeacon(tf.beacons[i], tf.beacons[i + 1]);
		});

		it("Should have custom metric 1 - JavaScript var - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet1, 11);
		});

		it("Should have custom metric 2 - JavaScript function - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet2, 22);
		});

		it("Should be missing custom metric 3 - undefined JavaScript var", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet3, undefined);
		});

		it("Should have the custom metric 4 - XPath", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet4, 444.44);
		});

		it("Should have the custom metric 5 - URL", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet5, 1);
		});

		it("Should be missing the custom timer 0 - NavigationTiming - because it's handled on the server", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom0);
		});

		it("Should have the custom timer 1 - JavaScript variable - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom1, 11);
		});

		it("Should have the custom timer 2 - JavaScript function - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom2, 22);
		});

		it("Should have the custom timer 3 - UserTiming (if UserTiming is supported)", function() {
			if (t.isUserTimingSupported()) {
				var b = tf.beacons[i];
				assert.isTrue(t.parseTimers(b.t_other).custom3 > 0);
			}
			else {
				this.skip();
			}
		});

		it("Should be missing the custom timer 3 - UserTiming (if UserTiming is not supported)", function() {
			if (!t.isUserTimingSupported()) {
				var b = tf.beacons[i];
				assert.isUndefined(t.parseTimers(b.t_other).custom3);
			}
			else {
				this.skip();
			}
		});

		it("Should be missing custom timer 4 - JavaScript var", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom4);
		});

		it("Should be missing custom timer 5 - UserTiming", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom5);
		});
	});

	//
	// Beacon 6
	//
	describe("Beacon 6 (spa)", function() {
		var i = 5;
		it("Should have sent the beacon for " + pathName, function() {
			var b = tf.beacons[i];
			assert.isTrue(b.u.indexOf(pathName) !== -1);
		});

		it("Should have sent the with a timestamp of at least 3 seconds (if MutationObserver is supported)", function() {
			if (t.isMutationObserverSupported()) {
				var b = tf.beacons[i];
				assert.operator(b.t_done, ">=", 3000);
			}
			else {
				this.skip();
			}
		});

		it("Should have sent the with a timestamp of under 1 second (if MutationObserver is not supported)", function() {
			if (!t.isMutationObserverSupported()) {
				var b = tf.beacons[i];
				assert.operator(b.t_done, "<=", 1000);
			}
			else {
				this.skip();
			}
		});

		it("Should have sent the beacon with a t_resp value (if MutationObserver and ResourceTiming are supported)", function() {
			if (t.isMutationObserverSupported() && t.isResourceTimingSupported()) {
				var b = tf.beacons[i];

				assert.operator(b.t_resp, ">=", 0);
			}
			else {
				this.skip();
			}
		});

		it("Should have sent the beacon with a t_page of total - t_resp (if MutationObserver and ResourceTiming are supported)", function() {
			if (t.isMutationObserverSupported() && t.isResourceTimingSupported()) {
				var pt = window.performance.timing;
				var b = tf.beacons[i];
				assert.equal(b.t_page, b.t_done - b.t_resp);
			}
			else {
				this.skip();
			}
		});

		it("Should have custom metric 1 - JavaScript var - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet1, 11);
		});

		it("Should have custom metric 2 - JavaScript function - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet2, 22);
		});

		it("Should be missing custom metric 3 - undefined JavaScript var", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet3, undefined);
		});

		it("Should have the custom metric 4 - XPath", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet4, 444.44);
		});

		it("Should have the custom metric 5 - URL", function() {
			var b = tf.beacons[i];
			assert.equal(b.cmet5, 1);
		});

		it("Should be missing the custom timer 0 - NavigationTiming - because it's handled on the server", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom0);
		});

		it("Should have the custom timer 1 - JavaScript variable - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom1, 11);
		});

		it("Should have the custom timer 2 - JavaScript function - having been updated by the SPA App", function() {
			var b = tf.beacons[i];
			assert.equal(t.parseTimers(b.t_other).custom2, 22);
		});

		it("Should have the custom timer 3 - UserTiming (if UserTiming is supported)", function() {
			if (t.isUserTimingSupported()) {
				var b = tf.beacons[i];
				assert.isTrue(t.parseTimers(b.t_other).custom3 > 0);
			}
			else {
				this.skip();
			}
		});

		it("Should be missing the custom timer 3 - UserTiming (if UserTiming is not supported)", function() {
			if (!t.isUserTimingSupported()) {
				var b = tf.beacons[i];
				assert.isUndefined(t.parseTimers(b.t_other).custom3);
			}
			else {
				this.skip();
			}
		});

		it("Should be missing custom timer 4 - JavaScript var", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom4);
		});

		it("Should be missing custom timer 5 - UserTiming", function() {
			var b = tf.beacons[i];
			assert.isUndefined(t.parseTimers(b.t_other).custom5);
		});
	});
};
