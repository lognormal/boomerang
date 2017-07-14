/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/19-navtiming/00-onload", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('onbeacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have fired onbeacon with a beacon payload", function() {
		// ensure the data was sent to 'onbeacon'
		assert.isObject(tf.lastBeacon());
	});

	it("Should have set basic beacon properties", function() {
		assert.isString(tf.lastBeacon().v);
	});

	it("Should have set nt_* properties", function() {
		var p = BOOMR.getPerformance();
		if (!p || !p.timing) {
			// NT not supported
			return;
		}

		assert.isNumber(tf.lastBeacon().nt_nav_st, "nt_nav_st");
		assert.isNumber(tf.lastBeacon().nt_red_st, "nt_red_st");
		assert.isNumber(tf.lastBeacon().nt_red_end, "nt_red_end");
		assert.isNumber(tf.lastBeacon().nt_fet_st, "nt_fet_st");
		assert.isNumber(tf.lastBeacon().nt_dns_st, "nt_dns_st");
		assert.isNumber(tf.lastBeacon().nt_dns_end, "nt_dns_end");
		assert.isNumber(tf.lastBeacon().nt_con_st, "nt_con_st");
		assert.isNumber(tf.lastBeacon().nt_con_end, "nt_con_end");
		assert.isNumber(tf.lastBeacon().nt_req_st, "nt_req_st");
		assert.isNumber(tf.lastBeacon().nt_res_st, "nt_res_st");
		assert.isNumber(tf.lastBeacon().nt_res_end, "nt_res_end");
		assert.isNumber(tf.lastBeacon().nt_domloading, "nt_domloading");
		assert.isNumber(tf.lastBeacon().nt_domint, "nt_domint");
		assert.isNumber(tf.lastBeacon().nt_domcontloaded_st, "nt_domcontloaded_st");
		assert.isNumber(tf.lastBeacon().nt_domcontloaded_end, "nt_domcontloaded_end");
		assert.isNumber(tf.lastBeacon().nt_domcomp, "nt_domcomp");
		assert.isNumber(tf.lastBeacon().nt_load_st, "nt_load_st");
		assert.isNumber(tf.lastBeacon().nt_load_end, "nt_load_end");
		assert.isNumber(tf.lastBeacon().nt_unload_st, "nt_unload_st");
		assert.isNumber(tf.lastBeacon().nt_unload_end, "nt_unload_end");

		if (location.protocol === "https:") {
			assert.isNumber(tf.lastBeacon().nt_ssl_st, "nt_ssl_st");
		}
	});

	it("Should have set Chrome nt_* properties", function() {
		var pt;
		if (window.chrome && window.chrome.loadTimes) {
			pt = window.chrome.loadTimes();
		}
		if (!pt) {
			// Not supported
			return;
		}

		assert.isNumber(tf.lastBeacon().nt_spdy, "nt_spdy");
		assert.isNotEmpty(tf.lastBeacon().nt_cinf, "nt_cinf");
		assert.isNumber(tf.lastBeacon().nt_first_paint, "nt_first_paint");
	});

	it("Should have set IE's nt_first_paint property", function() {
		var p = BOOMR.getPerformance();
		if (!p || !p.timing || !p.timing.msFirstPaint) {
			// NT first paint supported
			return;
		}

		assert.isNumber(tf.lastBeacon().nt_first_paint, "nt_first_paint");
	});

	it("Should have set NT2 properties", function() {
		var pt, p = BOOMR.getPerformance();
		if (!p || typeof p.getEntriesByType !== "function") {
			// NT2 not supported
			return;
		}
		pt = p.getEntriesByType("navigation");
		if (!pt || !pt.length) {
			// NT2 not supported
			return;
		}
		pt = pt[0];

		if (pt.workerStart) {
			assert.isNumber(tf.lastBeacon().nt_worker_start, "nt_worker_start");
		}

		if (pt.decodedBodySize || pt.transferSize) {
			assert.isNumber(tf.lastBeacon().nt_enc_size, "nt_enc_size");
			assert.isNumber(tf.lastBeacon().nt_dec_size, "nt_dec_size");
			assert.isNumber(tf.lastBeacon().nt_trn_size, "nt_trn_size");
		}

		if (pt.nextHopProtocol) {
			assert.isNotEmpty(tf.lastBeacon().nt_cinf, "nt_cinf");
			assert.equal(tf.lastBeacon().nt_cinf, pt.nextHopProtocol, "nt_cinf");
		}
	});

	it("Should have set nt_* navigation properties", function() {
		var p = BOOMR.getPerformance();
		if (!p || !p.navigation) {
			// NT not supported
			return;
		}

		assert.isNumber(tf.lastBeacon().nt_red_cnt, "nt_red_cnt");
		assert.isNumber(tf.lastBeacon().nt_nav_type, "nt_nav_type");
	});

});
