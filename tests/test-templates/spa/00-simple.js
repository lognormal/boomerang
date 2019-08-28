/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["00-simple"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have only sent one beacon", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 1);
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
			assert.equal(b.nt_red_cnt, 0, "nt_red_cnt is 0");  // no redirects
			assert.isDefined(b.nt_nav_type, "nt_nav_type is defined");
			assert.isDefined(b.nt_nav_st, "nt_nav_st is defined");
			assert.isUndefined(b.nt_red_st, "nt_red_st is undefined");  // no redirects
			assert.isUndefined(b.nt_red_end, "nt_red_end is undefined");  // no redirects
			assert.isDefined(b.nt_fet_st, "nt_fet_st is defined");
			assert.isDefined(b.nt_dns_st, "nt_dns_st is defined");
			assert.isDefined(b.nt_dns_end, "nt_dns_end is defined");
			assert.isDefined(b.nt_con_st, "nt_con_st is defined");
			assert.isDefined(b.nt_con_end, "nt_con_end is defined");
			assert.isDefined(b.nt_req_st, "nt_req_st is defined");
			assert.isDefined(b.nt_res_st, "nt_res_st is defined");
			assert.isDefined(b.nt_res_end, "nt_res_end is defined");
			assert.isDefined(b.nt_domloading, "nt_domloading is defined");
			assert.isDefined(b.nt_domint, "nt_domint is defined");
			assert.isDefined(b.nt_domcontloaded_st, "nt_domcontloaded_st is defined");
			assert.isDefined(b.nt_domcontloaded_end, "nt_domcontloaded_end is defined");
			assert.isDefined(b.nt_domcomp, "nt_domcomp is defined");
			assert.isDefined(b.nt_load_st, "nt_load_st is defined");
			assert.isDefined(b.nt_load_end, "nt_load_end is defined");
			assert.isDefined(b.nt_unload_st, "nt_unload_st is defined");
			assert.isDefined(b.nt_unload_end, "nt_unload_end is defined");
		}
		else {
			return this.skip();
		}
	});
};
