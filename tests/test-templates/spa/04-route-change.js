/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["04-route-change"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	var pathName = window.location.pathname;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent three beacons", function() {
		assert.equal(tf.beacons.length, 3);
	});

	it("Should have sent the first beacon as http.initiator = spa_hard", function() {
		assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
	});

	it("Should have sent all subsequent beacons as http.initiator = spa", function() {
		for (var i = 1; i < 2; i++) {
			assert.equal(tf.beacons[i]["http.initiator"], "spa");
		}
	});

	it("Should have sent all subsequent beacons have rt.nstart = navigationTiming (if NavigationTiming is supported)", function() {
		if (typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			for (var i = 1; i < 2; i++) {
				assert.equal(tf.beacons[i]["rt.nstart"], BOOMR.plugins.RT.navigationStart());
			}
		}
	});

	it("Should not have Boomerang timings on SPA Soft beacons", function() {
		for (var i = 1; i < 2; i++) {
			if (tf.beacons[i].t_other) {
				assert.equal(tf.beacons[i].t_other.indexOf("boomr_fb"), -1, "should not have boomr_fb");
				assert.equal(tf.beacons[i].t_other.indexOf("boomr_ld"), -1, "should not have boomr_ld");
				assert.equal(tf.beacons[i].t_other.indexOf("boomr_lat"), -1, "should not have boomr_lat");
				assert.equal(tf.beacons[i].t_other.indexOf("boomerang"), -1, "should not have boomerang");
			}

			// Boomerang and config timing parameters
			assert.isUndefined(tf.beacons[i]["rt.bmr"]);
			assert.isUndefined(tf.beacons[i]["rt.cnf"]);
		}
	});

	//
	// Beacon 1
	//
	it("Should have sent the first beacon for " + pathName, function() {
		var b = tf.beacons[0];
		assert.isTrue(b.u.indexOf(pathName) !== -1);
	});

	it("Should take as long as the longest img load (if MutationObserver and NavigationTiming are supported)", function() {
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			t.validateBeaconWasSentAfter(0, "img.jpg&id=home", 500, 3000, 30000, 0);
		}
	});

	it("Should not have a load time (if MutationObserver is supported but NavigationTiming is not)", function() {
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
			var b = tf.beacons[0];
			assert.equal(b.t_done, undefined);
		}
	});

	it("Should take as long as the XHRs (if MutationObserver is not supported but NavigationTiming is)", function() {
		if (typeof window.MutationObserver === "undefined" && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			t.validateBeaconWasSentAfter(0, "widgets.json", 500, 0, 30000, false);
		}
	});

	it("Shouldn't have a load time (if MutationObserver and NavigationTiming are not supported)", function() {
		if (typeof window.MutationObserver === "undefined" && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
			var b = tf.beacons[0];
			assert.equal(b.t_done, undefined);
			assert.equal(b["rt.start"], "none");
		}
	});

	it("Should have a t_resp of the root page (if MutationObserver and NavigationTiming are supported)", function() {
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			var pt = window.performance.timing;
			var b = tf.beacons[0];
			assert.equal(b.t_resp, pt.responseStart - pt.fetchStart);
		}
	});

	it("Should have a t_page of total - t_resp (if MutationObserver and NavigationTiming are supported)", function() {
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			var pt = window.performance.timing;
			var b = tf.beacons[0];
			assert.equal(b.t_page, b.t_done - b.t_resp);
		}
	});

	//
	// Beacon 2
	//
	it("Should have sent the second beacon for /widgets/1", function() {
		var b = tf.beacons[1];
		assert.isTrue(b.u.indexOf("/widgets/1") !== -1);
	});

	it("Should have sent the second beacon with a timestamp of at least 1 second (if MutationObserver is supported)", function() {
		if (window.MutationObserver) {
			// because of the widget IMG delaying 1 second
			var b = tf.beacons[1];
			assert.operator(b.t_done, ">=", 1000);
		}
	});

	it("Should have sent the second beacon with a timestamp of at least 1 millisecond (if MutationObserver is not supported)", function() {
		if (typeof window.MutationObserver === "undefined") {
			// because of the widget IMG delaying 1 second but we couldn't track it because no MO support
			var b = tf.beacons[1];
			assert.operator(b.t_done, ">=", 0);
		}
	});

	it("Should have sent the second beacon with a t_resp value (if MutationObserver and NavigationTiming are supported)", function() {
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			var pt = window.performance.timing;
			var b = tf.beacons[1];

			assert.operator(b.t_resp, ">=", 0);
		}
	});

	it("Should have sent the second beacon with a t_page of total - t_resp (if MutationObserver and NavigationTiming are supported)", function() {
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			var pt = window.performance.timing;
			var b = tf.beacons[1];
			assert.equal(b.t_page, b.t_done - b.t_resp);
		}
	});

	//
	// Beacon 3
	//
	it("Should have sent the third beacon for " + pathName, function() {
		var b = tf.beacons[2];
		assert.isTrue(b.u.indexOf(pathName) !== -1);
	});

	it("Should have sent the third with a timestamp of at least 3 seconds (if MutationObserver is supported)", function() {
		if (window.MutationObserver) {
			var b = tf.beacons[2];
			assert.operator(b.t_done, ">=", 3000);
		}
	});

	it("Should have sent the third with a timestamp of under 1 second (if MutationObserver is not supported)", function() {
		if (!window.MutationObserver) {
			var b = tf.beacons[2];
			assert.operator(b.t_done, "<=", 1000);
		}
	});

	it("Should have sent the third beacon with a t_resp value (if MutationObserver and NavigationTiming are supported)", function() {
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			var pt = window.performance.timing;
			var b = tf.beacons[2];

			assert.operator(b.t_resp, ">=", 0);
		}
	});

	it("Should have sent the third beacon with a t_page of total - t_resp (if MutationObserver and NavigationTiming are supported)", function() {
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			var pt = window.performance.timing;
			var b = tf.beacons[2];
			assert.equal(b.t_page, b.t_done - b.t_resp);
		}
	});

	it("Should have set the same Page ID (pid) on all beacons", function() {
		var pid = tf.beacons[0].pid;
		for (var i = 0; i <= 2; i++) {
			var b = tf.beacons[i];
			assert.equal(b.pid, pid);
		}
	});
};
