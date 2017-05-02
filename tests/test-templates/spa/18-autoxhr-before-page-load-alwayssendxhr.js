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

	var XHR_BEACONS = [1, 2];
	var SPA_BEACONS = [0];

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
	// XHR beacons
	//
	it("Should have set http.initiator = 'xhr' on the XHR beacons (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			for (var k in XHR_BEACONS) {
				if (XHR_BEACONS.hasOwnProperty(k)) {
					var i = XHR_BEACONS[k];
					assert.equal(tf.beacons[i]["http.initiator"], "xhr");
				}
			}
		}
	});

	it("Should have set rt.start = 'manual' on the XHR beacons (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			for (var k in XHR_BEACONS) {
				if (XHR_BEACONS.hasOwnProperty(k)) {
					var i = XHR_BEACONS[k];
					assert.equal(tf.beacons[i]["rt.start"], "manual");
				}
			}
		}
	});

	it("Should have set beacon's nt_* timestamps accurately (if AutoXHR is enabled and NavigationTiming is supported)", function() {
		if (BOOMR.plugins.AutoXHR && t.isNavigationTimingSupported()) {
			for (var k in XHR_BEACONS) {
				if (XHR_BEACONS.hasOwnProperty(k)) {
					var i = XHR_BEACONS[k];
					var b = tf.beacons[i];

					var res = t.findFirstResource(b.u);
					var st = BOOMR.window.performance.timing.navigationStart;

					for (var beaconProp in BEACON_VAR_RT_MAP) {
						var resTime = Math.floor(res[BEACON_VAR_RT_MAP[beaconProp]] + st);

						assert.equal(
							b[beaconProp],
							resTime,
							"Beacon #" + i + ": " + beaconProp + "=" + b[beaconProp] + " vs " + BEACON_VAR_RT_MAP[beaconProp] + "=" + resTime);
					}
				}
			}
		}
	});

	it("Should have set pgu = the page's location on the XHR beacons (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			for (var k in XHR_BEACONS) {
				if (XHR_BEACONS.hasOwnProperty(k)) {
					var i = XHR_BEACONS[k];
					assert.include(BOOMR.window.location.href, tf.beacons[i].pgu);
				}
			}
		}
	});

	it("Should have set nt_load_end==nt_load_st==rt.end on the XHR beacons (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			for (var k in XHR_BEACONS) {
				if (XHR_BEACONS.hasOwnProperty(k)) {
					var i = XHR_BEACONS[k];
					var b = tf.beacons[i];

					assert.equal(b.nt_load_end, b.nt_load_st);
					assert.equal(b.nt_load_end, b["rt.end"]);
				}
			}
		}
	});

	it("Should have set t_done = rt.end - nt_fet_st for the XHR beacons (if AutoXHR is enabled and NavigationTiming is supported)", function() {
		if (BOOMR.plugins.AutoXHR && t.isNavigationTimingSupported()) {
			for (var k in XHR_BEACONS) {
				if (XHR_BEACONS.hasOwnProperty(k)) {
					var i = XHR_BEACONS[k];
					var b = tf.beacons[i];
					assert.equal(b.t_done, b["rt.end"] - b.nt_fet_st);
				}
			}
		}
	});

	it("Should have set t_resp = nt_res_end - nt_fet_st for the XHR beacons (if AutoXHR is enabled and NavigationTiming is supported)", function() {
		if (BOOMR.plugins.AutoXHR && t.isNavigationTimingSupported()) {
			for (var k in XHR_BEACONS) {
				if (XHR_BEACONS.hasOwnProperty(k)) {
					var i = XHR_BEACONS[k];
					var b = tf.beacons[i];
					assert.equal(b.t_resp, b.nt_res_end - b.nt_fet_st);
				}
			}
		}
	});

	it("Should have set t_page = t_done - t_resp for the XHR beacons (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			for (var k in XHR_BEACONS) {
				if (XHR_BEACONS.hasOwnProperty(k)) {
					var i = XHR_BEACONS[k];
					var b = tf.beacons[i];
					assert.closeTo(b.t_page, b.t_done - b.t_resp, 100);
				}
			}
		}
	});

	//
	// First beacon: XHR home.html
	//
	it("Should have contain home.html for the first beacon's URL (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			var b1 = tf.beacons[XHR_BEACONS[0]];
			var b2 = tf.beacons[XHR_BEACONS[1]];
			assert.equal(t.checkStringInArray("home.html", [b1.u, b2.u]).length, 1, "Neither of the 2 XHR beacons had the string we were looking for.");
		}
	});

	//
	// Second beacon: XHR widgets.json
	//
	it("Should have contain widgets.json for the first beacon's URL (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			var b1 = tf.beacons[XHR_BEACONS[0]];
			var b2 = tf.beacons[XHR_BEACONS[1]];
			assert.equal(t.checkStringInArray("widgets.json", [b1.u, b2.u]).length, 1, "Neither of the 2 XHR beacons had the string we were looking for.");
		}
	});

	//
	// Third beacon: SPA
	//
	it("Should have set http.initiator = 'spa_hard' on the last beacon", function() {
		var b = tf.beacons[SPA_BEACONS[0]];
		assert.equal(b["http.initiator"], "spa_hard");
	});
};
