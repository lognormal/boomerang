/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["00-simple"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have only sent one beacon", function() {
		// only one beacon should've been sent
		assert.equal(tf.beacons.length, 1);
	});

	it("Should take as long as the longest img load (if MutationObserver and NavigationTiming are supported)", function() {
		if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			t.validateBeaconWasSentAfter(0, "img.jpg", 100, 3000, 30000, true);
		}
		else {
			return this.skip();
		}
	});

	it("Should have a t_resp of the root page (if MutationObserver and NavigationTiming are supported)", function() {
		if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			var pt = window.performance.timing;
			var b = tf.lastBeacon();
			assert.equal(b.t_resp, pt.responseStart - pt.navigationStart);
		}
		else {
			return this.skip();
		}
	});

	it("Should have a t_page of total - t_resp (if MutationObserver and NavigationTiming are supported)", function() {
		if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			var pt = window.performance.timing;
			var b = tf.lastBeacon();
			assert.equal(b.t_page, b.t_done - b.t_resp);
		}
		else {
			return this.skip();
		}
	});

	it("Should not have a load time (if MutationObserver is supported but NavigationTiming is not)", function() {
		if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
			var b = tf.lastBeacon();
			assert.equal(b.t_done, undefined);
		}
		else {
			return this.skip();
		}
	});

	it("Should take as long as the XHRs (if MutationObserver is not supported but NavigationTiming is)", function() {
		if (!t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			// this fails in react, onload happens later than the XHR
			t.validateBeaconWasSentAfter(0, "widgets.json", 100, 0, 30000, true);
		}
		else {
			return this.skip();
		}
	});

	it("Shouldn't have a load time (if MutationObserver and NavigationTiming are not supported)", function() {
		if (!t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
			var b = tf.lastBeacon();
			assert.equal(b.t_done, undefined);
			assert.equal(b["rt.start"], "none");
		}
		else {
			return this.skip();
		}
	});

	it("Should have sent the http.initiator as 'spa_hard'", function() {
		var b = tf.lastBeacon();
		assert.equal(b["http.initiator"], "spa_hard");
	});

	it("Should have NavigationTiming metrics (if MutationObserver and NavigationTiming are supported)", function() {
		if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			var b = tf.lastBeacon();
			assert.equal(b.nt_red_cnt, 0);  // no redirects
			assert.isDefined(b.nt_nav_type);
			assert.isDefined(b.nt_nav_st);
			assert.isUndefined(b.nt_red_st);  // no redirects
			assert.isUndefined(b.nt_red_end);  // no redirects
			assert.isDefined(b.nt_fet_st);
			assert.isDefined(b.nt_dns_st);
			assert.isDefined(b.nt_dns_end);
			assert.isDefined(b.nt_con_st);
			assert.isDefined(b.nt_con_end);
			assert.isDefined(b.nt_req_st);
			assert.isDefined(b.nt_res_st);
			assert.isDefined(b.nt_res_end);
			assert.isDefined(b.nt_domloading);
			assert.isDefined(b.nt_domint);
			assert.isDefined(b.nt_domcontloaded_st);
			assert.isDefined(b.nt_domcontloaded_end);
			assert.isDefined(b.nt_domcomp);
			assert.isDefined(b.nt_load_st);
			assert.isDefined(b.nt_load_end);
			assert.isDefined(b.nt_unload_st);
			assert.isDefined(b.nt_unload_end);
		}
		else {
			return this.skip();
		}
	});

	it("Should have set Page ID (pid)", function() {
		assert.isString(tf.lastBeacon().pid, "pid");
	});
};
