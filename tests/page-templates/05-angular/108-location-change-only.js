/*eslint-env mocha*/
describe("e2e/05-angular/108-location-change-only", function() {
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

	it("Should have a load time (if MutationObserver and NavigationTiming are supported)", function() {
		if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			var b = tf.beacons[0];
			assert.isDefined(b.t_done);
		}
	});

	it("Should not have a load time (if MutationObserver is supported but NavigationTiming is not)", function() {
		if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
			var b = tf.beacons[0];
			assert.equal(b.t_done, undefined);
		}
	});

	it("Should take as long as the XHRs (if MutationObserver is not supported but NavigationTiming is)", function() {
		if (!t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			t.validateBeaconWasSentAfter(0, "widgets.json", 500, 0, 30000, false);
		}
	});

	it("Shouldn't have a load time (if MutationObserver and NavigationTiming are not supported)", function() {
		if (!t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
			var b = tf.beacons[0];
			assert.equal(b.t_done, undefined);
			assert.equal(b["rt.start"], "none");
		}
	});

	it("Should have a t_resp of the root page (if MutationObserver and NavigationTiming are supported)", function() {
		if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			var pt = window.performance.timing;
			var b = tf.beacons[0];
			assert.equal(b.t_resp, pt.responseStart - pt.navigationStart);
		}
	});

	it("Should have a t_page of total - t_resp (if MutationObserver and NavigationTiming are supported)", function() {
		if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			var pt = window.performance.timing;
			var b = tf.beacons[0];
			assert.equal(b.t_page, b.t_done - b.t_resp);
		}
	});

	//
	// Beacon 2
	//
	it("Should have sent the second beacon for /nothing", function() {
		var b = tf.beacons[1];
		assert.isTrue(b.u.indexOf("/nothing") !== -1);
	});

	it("Should have sent the second beacon with a timestamp of ~0 seconds (if MutationObserver is supported)", function() {
		if (t.isMutationObserverSupported()) {
			var b = tf.beacons[1];
			assert.closeTo(b.t_done, 0, 50);
		}
	});

	//
	// Beacon 3
	//
	it("Should have sent the third beacon for " + pathName, function() {
		var b = tf.beacons[2];
		assert.isTrue(b.u.indexOf(pathName) !== -1);
	});

	it("Should have sent the third with a timestamp of at around 0 seconds (if MutationObserver is supported)", function() {
		if (t.isMutationObserverSupported()) {
			var b = tf.beacons[2];
			assert.closeTo(b.t_done, 0, 50);
		}
	});

	it("Should have set the same Page ID (pid) on all beacons", function() {
		var pid = tf.beacons[0].pid;
		for (var i = 0; i <= 2; i++) {
			var b = tf.beacons[i];
			assert.equal(b.pid, pid);
		}
	});
});
