/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/19-navtiming/00-onload", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	var NT_PROPERTIES = [
		"nt_nav_st",
		"nt_fet_st",
		"nt_dns_st",
		"nt_dns_end",
		"nt_con_st",
		"nt_con_end",
		"nt_req_st",
		"nt_res_st",
		"nt_res_end",
		"nt_domloading",
		"nt_domint",
		"nt_domcontloaded_st",
		"nt_domcontloaded_end",
		"nt_domcomp",
		"nt_load_st",
		"nt_load_end"
	];

	var NT_PROPERTIES_OPTIONAL = [
		"nt_unload_st",
		"nt_unload_end"
	];

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have fired 'beacon' with a beacon payload", function() {
		// ensure the data was sent to 'beacon'
		assert.isObject(tf.lastBeacon());
	});

	it("Should have set basic beacon properties", function() {
		assert.isString(tf.lastBeacon().v);
	});

	it("Should have set nt_* properties (if NavigationTiming is supported)", function() {
		if (!t.isNavigationTimingSupported()) {
			return this.skip();
		}

		for (var i = 0; i < NT_PROPERTIES.length; i++) {
			assert.isNumber(tf.lastBeacon()[NT_PROPERTIES[i]], NT_PROPERTIES[i]);
		}

		if (location.protocol === "https:") {
			assert.isNumber(tf.lastBeacon().nt_ssl_st, "nt_ssl_st");
		}
	});

	it("Should have set set nt_* properties as Unix-epoch timestamps, not DOMHighResTimestamps (if NavigationTiming is supported)", function() {
		if (!t.isNavigationTimingSupported()) {
			return this.skip();
		}

		for (var i = 0; i < NT_PROPERTIES.length; i++) {
			// Jan 1 2000
			assert.operator(parseInt(tf.lastBeacon()[NT_PROPERTIES[i]], 10), ">=", 946684800, NT_PROPERTIES[i]);

			// Jan 1 2050
			assert.operator(parseInt(tf.lastBeacon()[NT_PROPERTIES[i]], 10), "<=", 2524658358000, NT_PROPERTIES[i]);

			// make sure it's not decimal
			assert.notInclude(tf.lastBeacon()[NT_PROPERTIES[i]], ".");
		}

		for (var i = 0; i < NT_PROPERTIES_OPTIONAL.length; i++) {
			if (typeof tf.lastBeacon()[NT_PROPERTIES_OPTIONAL[i]] !== "undefined") {
				// Jan 1 2000
				assert.operator(parseInt(tf.lastBeacon()[NT_PROPERTIES_OPTIONAL[i]], 10), ">=", 946684800, NT_PROPERTIES_OPTIONAL[i]);

				// Jan 1 2050
				assert.operator(parseInt(tf.lastBeacon()[NT_PROPERTIES_OPTIONAL[i]], 10), "<=", 2524658358000, NT_PROPERTIES_OPTIONAL[i]);

				// make sure it's not decimal
				assert.notInclude(tf.lastBeacon()[NT_PROPERTIES_OPTIONAL[i]], ".");
			}
		}
	});

	it("Should have set set nt_* properties as full numbers, not decimals (if NavigationTiming is supported)", function() {
		if (!t.isNavigationTimingSupported()) {
			return this.skip();
		}

		for (var i = 0; i < NT_PROPERTIES.length; i++) {
			assert.notInclude(tf.lastBeacon()[NT_PROPERTIES[i]], ".", NT_PROPERTIES[i]);
		}

		for (var i = 0; i < NT_PROPERTIES_OPTIONAL.length; i++) {
			if (typeof tf.lastBeacon()[NT_PROPERTIES_OPTIONAL[i]] !== "undefined") {
				assert.notInclude(tf.lastBeacon()[NT_PROPERTIES_OPTIONAL[i]], ".", NT_PROPERTIES_OPTIONAL[i]);
			}
		}
	});

	it("Should have set Chrome nt_spdy (if the browser is Chrome, and if NavigationTiming2 w/ nextHopProtocol isn't supported)", function() {
		if (!t.isChromeLoadTimesSupported() || t.isNavigationTiming2WithNextHopProtocolSupported()) {
			return this.skip();
		}

		assert.isNumber(tf.lastBeacon().nt_spdy, "nt_spdy");
	});

	it("Should not have set Chrome nt_spdy (if the browser is Chrome, and if NavigationTiming2  w/ nextHopProtocol is supported)", function() {
		if (!t.isChromeLoadTimesSupported() || !t.isNavigationTiming2WithNextHopProtocolSupported()) {
			return this.skip();
		}

		assert.isUndefined(tf.lastBeacon().nt_spdy);
	});

	it("Should have set Chrome nt_cinf (if the browser is Chrome, and if NavigationTiming2 w/ nextHopProtocol isn't supported)", function() {
		if (!t.isChromeLoadTimesSupported() || t.isNavigationTiming2WithNextHopProtocolSupported()) {
			return this.skip();
		}

		assert.isDefined(tf.lastBeacon().nt_cinf, "nt_cinf");
	});

	it("Should not have set Chrome nt_cinf (if the browser is Chrome, and if NavigationTiming2 w/ nextHopProtocol is supported)", function() {
		if (!t.isChromeLoadTimesSupported() || !t.isNavigationTiming2WithNextHopProtocolSupported()) {
			return this.skip();
		}

		assert.isUndefined(tf.lastBeacon().nt_cinf);
	});

	it("Should have set Chrome nt_first_paint via Chrome loadTimes (if the browser is Chrome, and PaintTiming is not supported)", function() {
		if (!t.isChromeLoadTimesSupported() || t.isPaintTimingSupported()) {
			return this.skip();
		}

		var pt;
		if (window.chrome && window.chrome.loadTimes) {
			pt = window.chrome.loadTimes();
		}

		// validation of firstPaintTime
		assert.isNumber(tf.lastBeacon().nt_first_paint, "nt_first_paint");
		assert.operator(parseInt(tf.lastBeacon().nt_first_paint, 10), ">=", parseInt(tf.lastBeacon().nt_nav_st, 10));
		assert.equal(tf.lastBeacon().nt_first_paint, Math.round(pt.firstPaintTime * 1000));
	});

	it("Should have set nt_first_paint via msFirstPaint (if IE)", function() {
		var p = BOOMR.getPerformance();
		if (!p || !p.timing || !p.timing.msFirstPaint) {
			// NT first paint not supported
			return this.skip();
		}

		assert.isNumber(tf.lastBeacon().nt_first_paint, "nt_first_paint");
		assert.operator(parseInt(tf.lastBeacon().nt_first_paint, 10), ">=", parseInt(tf.lastBeacon().nt_nav_st, 10));
		assert.equal(tf.lastBeacon().nt_first_paint, p.timing.msFirstPaint);
	});

	it("Should have set nt_first_paint via PaintTiming (if PaintTiming is supported and happened by load)", function() {
		if (!t.isPaintTimingSupported()) {
			return this.skip();
		}

		var pt = BOOMR.utils.arrayFind(performance.getEntriesByType("paint"), function(entry) {
			return entry.name === "first-paint";
		});

		// skip if it happened after onload
		if (!pt || pt.startTime > parseInt(tf.lastBeacon().t_done, 10)) {
			return this.skip();
		}

		// validation of firstPaint
		assert.isNumber(tf.lastBeacon().nt_first_paint, "nt_first_paint");
		assert.operator(parseInt(tf.lastBeacon().nt_first_paint, 10), ">=", parseInt(tf.lastBeacon().nt_nav_st, 10));
		assert.equal(tf.lastBeacon().nt_first_paint, Math.floor(pt.startTime + performance.timing.navigationStart));
	});

	it("Should have set NT2 properties (if NavigationTiming2 is supported)", function() {
		var pt, p = BOOMR.getPerformance();
		if (!p || typeof p.getEntriesByType !== "function") {
			// NT2 not supported
			return this.skip();
		}

		pt = p.getEntriesByType("navigation");
		if (!pt || !pt.length) {
			// NT2 not supported
			return this.skip();
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
			assert.isDefined(tf.lastBeacon().nt_protocol, "nt_protocol");
			assert.equal(tf.lastBeacon().nt_protocol, pt.nextHopProtocol, "nt_protocol");
		}
	});

	it("Should have set nt_nav_type property (if NavigationTiming is supported)", function() {
		if (!t.isNavigationTimingSupported()) {
			return this.skip();
		}

		assert.isNumber(tf.lastBeacon().nt_nav_type, "nt_nav_type");
	});

	it("Should have set nt_red_cnt property to 0 (if NavigationTiming is supported)", function() {
		if (!t.isNavigationTimingSupported()) {
			return this.skip();
		}

		assert.equal(tf.lastBeacon().nt_red_cnt, 0);
	});

	it("Should not have set redirect timing properties (if NavigationTiming is supported)", function() {
		if (!t.isNavigationTimingSupported()) {
			return this.skip();
		}

		assert.isUndefined(tf.lastBeacon().nt_red_st, "nt_red_st");
		assert.isUndefined(tf.lastBeacon().nt_red_end, "nt_red_end");
	});
});
