/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["07-soft-nav-resources"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent 5 beacons", function() {
		assert.equal(tf.beacons.length, 5);
	});

	it("Should have sent the first beacon as http.initiator = spa_hard", function() {
		assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
	});

	it("Should have sent all subsequent beacons as http.initiator = spa", function() {
		for (var i = 1; i < 4; i++) {
			assert.equal(tf.beacons[i]["http.initiator"], "spa");
		}
	});

	it("Should have sent all subsequent beacons have rt.nstart = navigationTiming (if NavigationTiming is supported)", function() {
		if (typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			for (var i = 1; i < 4; i++) {
				assert.equal(tf.beacons[i]["rt.nstart"], BOOMR.plugins.RT.navigationStart());
			}
		}
	});

	//
	// Beacon 1
	//
	it("Should have sent the first beacon for /07-soft-nav-resources.html", function() {
		var b = tf.beacons[0];
		assert.isTrue(b.u.indexOf("/07-soft-nav-resources.html") !== -1);
	});

	it("Should have the first beacon take as long as the first img load (if MutationObserver and NavigationTiming are supported)", function() {
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			t.validateBeaconWasSentAfter(0, "img.jpg&id=home", 500, 3000, 30000);
		}
	});

	it("Should have the first beacon take as long as the first img load (if MutationObserver is supported but NavigationTiming is not)", function() {
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
			var b = tf.beacons[0];
			assert.equal(b.t_done, undefined);
		}
	});

	it("Should have the first beacon take as long as the XHRs (if MutationObserver is not supported but NavigationTiming is)", function() {
		if (typeof window.MutationObserver === "undefined" && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			t.validateBeaconWasSentAfter(0, "widgets.json", 500, 0, 30000, false);
		}
	});

	it("Shouldn't have the first beacon have a load time (if MutationObserver and NavigationTiming are not supported)", function() {
		if (typeof window.MutationObserver === "undefined" && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
			var b = tf.beacons[0];
			assert.equal(b.t_done, undefined);
			assert.equal(b["rt.start"], "none");
		}
	});

	//
	// Beacon 2
	//
	it("Should have sent the second beacon for /widgets/1", function() {
		var b = tf.beacons[1];
		assert.isTrue(b.u.indexOf("/widgets/1") !== -1);
	});

	it("Should have sent the second beacon with a timestamp of at least 1 seconds (if MutationObserver is supported)", function() {
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

	it("Should have sent the second beacon with a timestamp of less than 30 seconds", function() {
		// because of the widget IMG delaying 1 second
		var b = tf.beacons[1];
		assert.operator(b.t_done, "<=", 30000);
	});

	//
	// Beacon 3
	//
	it("Should have sent the third beacon for /widgets/2", function() {
		var b = tf.beacons[2];
		assert.isTrue(b.u.indexOf("/widgets/2") !== -1);
	});

	it("Should have sent the third beacon with a timestamp of at least 2 seconds (if MutationObserver is supported)", function() {
		if (window.MutationObserver) {
			// because of the widget IMG delaying 2 second
			var b = tf.beacons[2];
			assert.operator(b.t_done, ">=", 2000);
		}
	});

	it("Should have sent the third beacon with a timestamp of at least 1 millisecond (if MutationObserver is not supported)", function() {
		if (typeof window.MutationObserver === "undefined") {
			// because of the widget IMG delaying 2 seconds but we couldn't track it because no MO support
			var b = tf.beacons[2];
			assert.operator(b.t_done, ">=", 0);
		}
	});

	it("Should have sent the third beacon with a timestamp of less than 30 seconds", function() {
		// because of the widget IMG delaying 2 second
		var b = tf.beacons[2];
		assert.operator(b.t_done, "<=", 30000);
	});

	//
	// Beacon 4
	//
	it("Should have sent the fourth beacon for /widgets/3", function() {
		var b = tf.beacons[3];
		assert.isTrue(b.u.indexOf("/widgets/3") !== -1);
	});

	it("Should have sent the fourth beacon with a timestamp of at least 3 seconds (if MutationObserver is supported)", function() {
		if (window.MutationObserver) {
			// because of the widget IMG delaying 3 second
			var b = tf.beacons[3];
			assert.operator(b.t_done, ">=", 3000);
		}
	});

	it("Should have sent the fourth beacon with a timestamp of at least 1 millisecond (if MutationObserver is not supported)", function() {
		if (typeof window.MutationObserver === "undefined") {
			// because of the widget IMG delaying 3 seconds but we couldn't track it because no MO support
			var b = tf.beacons[3];
			assert.operator(b.t_done, ">=", 0);
		}
	});

	it("Should have sent the fourth beacon with a timestamp of less than 30 seconds", function() {
		// because of the widget IMG delaying 3 second
		var b = tf.beacons[3];
		assert.operator(b.t_done, "<=", 30000);
	});

	//
	// Beacon 5
	//
	it("Should have sent the fifth beacon for /07-soft-nav-resources.html", function() {
		var b = tf.beacons[4];
		assert.isTrue(b.u.indexOf("/07-soft-nav-resources.html") !== -1);
	});

	it("Should have sent the fifth with a timestamp of less than 10 seconds", function() {
		// now that the initial page is cached, it should be a quick navigation
		var b = tf.beacons[4];
		assert.operator(b.t_done, "<=", 10000);
	});

	it("Should have sent the fifth beacon without any NavigationTiming metrics (if MutationObserver and NavigationTiming are supported)", function() {
		if (typeof window.MutationObserver !== "undefined" && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			var b = tf.lastBeacon();
			assert.isUndefined(b.nt_red_cnt);
			assert.isUndefined(b.nt_nav_type);
			assert.isUndefined(b.nt_nav_st);
			assert.isUndefined(b.nt_red_st);
			assert.isUndefined(b.nt_red_end);
			assert.isUndefined(b.nt_fet_st);
			assert.isUndefined(b.nt_dns_st);
			assert.isUndefined(b.nt_dns_end);
			assert.isUndefined(b.nt_con_st);
			assert.isUndefined(b.nt_con_end);
			assert.isUndefined(b.nt_req_st);
			assert.isUndefined(b.nt_res_st);
			assert.isUndefined(b.nt_res_end);
			assert.isUndefined(b.nt_domloading);
			assert.isUndefined(b.nt_domint);
			assert.isUndefined(b.nt_domcontloaded_st);
			assert.isUndefined(b.nt_domcontloaded_end);
			assert.isUndefined(b.nt_domcomp);
			assert.isUndefined(b.nt_load_st);
			assert.isUndefined(b.nt_load_end);
			assert.isUndefined(b.nt_unload_st);
			assert.isUndefined(b.nt_unload_end);
		}
	});
};
