/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["18-autoxhr-before-page-load-alwayssendxhr"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	var BEACON_VAR_RT_MAP = {
		"nt_con_end": "connectEnd",
		"nt_con_st": "connectStart",
		"nt_dns_end": "domainLookupEnd",
		"nt_dns_st": "domainLookupStart",
		// "nt_domint": maps to the DOM's interactive state
		"nt_fet_st": "fetchStart",
		// "nt_load_end": maps to loadEventEnd of the XHR
		// "nt_load_st": maps to loadEventEnd of the XHR
		"nt_req_st": "requestStart",
		"nt_res_end": "responseEnd",
		"nt_res_st": "responseStart"
	};

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent 3 beacons (AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			assert.equal(tf.beacons.length, 3);
		}
	});

	it("Should have sent 1 beacons (if AutoXHR is not enabled)", function() {
		if (!BOOMR.plugins.AutoXHR) {
			assert.equal(tf.beacons.length, 1);
		}
	});

	//
	// First two beacons
	//
	it("Should have set http.initiator = 'xhr' on the first two beacons (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			for (var i = 0; i < 1; i++) {
				assert.equal(tf.beacons[i]["http.initiator"], "xhr");
			}
		}
	});

	it("Should have set rt.start = 'manual' on the first two beacons (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			for (var i = 0; i < 1; i++) {
				assert.equal(tf.beacons[i]["rt.start"], "manual");
			}
		}
	});

	it("Should have set beacon's nt_* timestamps accurately (if AutoXHR is enabled and NavigationTiming is supported)", function() {
		if (BOOMR.plugins.AutoXHR && t.isNavigationTimingSupported()) {
			for (var i = 0; i < 1; i++) {
				var b = tf.beacons[i];

				var res = t.findFirstResource(b.u);
				var st = BOOMR.window.performance.timing.navigationStart;

				for (var beaconProp in BEACON_VAR_RT_MAP) {
					var resTime = Math.round(res[BEACON_VAR_RT_MAP[beaconProp]] + st);

					assert.equal(
						b[beaconProp],
						resTime,
						"Beacon #" + i + ": " + beaconProp + "=" + b[beaconProp] + " vs " + BEACON_VAR_RT_MAP[beaconProp] + "=" + resTime);
				}
			}
		}
	});

	it("Should have set pgu = the page's location on the first two beacons (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			for (var i = 0; i < 1; i++) {
				assert.equal(tf.beacons[i].pgu, BOOMR.window.location.href);
			}
		}
	});

	it("Should have set nt_load_end==nt_load_st==rt.end on the first two beacons (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			for (var i = 0; i < 1; i++) {
				var b = tf.beacons[i];

				assert.equal(b.nt_load_end, b.nt_load_st);
				assert.equal(b.nt_load_end, b["rt.end"]);
			}
		}
	});

	it("Should have set t_done = rt.end - nt_fet_st for the first two beacons (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			for (var i = 0; i < 1; i++) {
				var b = tf.beacons[i];
				assert.equal(b.t_done, b["rt.end"] - b.nt_fet_st);
			}
		}
	});

	it("Should have set t_resp = nt_res_end - nt_fet_st for the first two beacons (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			for (var i = 0; i < 1; i++) {
				var b = tf.beacons[i];
				assert.equal(b.t_resp, b.nt_res_end - b.nt_fet_st);
			}
		}
	});

	it("Should have set t_page = t_done - t_resp for the first two beacons (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			for (var i = 0; i < 1; i++) {
				var b = tf.beacons[i];
				assert.equal(b.t_page, b.t_done - b.t_resp);
			}
		}
	});

	//
	// First beacon: XHR home.html
	//
	it("Should have contain home.html for the first beacon's URL (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			var b = tf.beacons[0];
			assert.include(b.u, "home.html");
		}
	});

	//
	// Second beacon: XHR widgets.json
	//
	it("Should have contain widgets.json for the first beacon's URL (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			var b = tf.beacons[1];
			assert.include(b.u, "widgets.json");
		}
	});

	//
	// Third beacon: SPA
	//
	it("Should have set http.initiator = 'spa_hard' on the last beacon", function() {
		var b = tf.beacons[tf.beacons.length - 1];
		assert.equal(b["http.initiator"], "spa_hard");
	});
};
