
/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["19-autoxhr-during-nav-alwayssendxhr"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	var BEACONS_SENT = 7;
	var XHR_BEACONS = [0, 2, 3, 5];
	var SPA_HARD_BEACONS = [1];
	var SPA_BEACONS = [4, 6];

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

	it("Should have sent 7 beacons (AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			assert.equal(tf.beacons.length, BEACONS_SENT);
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
						var resTime = Math.round(res[BEACON_VAR_RT_MAP[beaconProp]] + st);

						assert.equal(
							b[beaconProp],
							resTime,
							"Beacon #" + i + ": " + beaconProp + "=" + b[beaconProp]
								+ " vs " + BEACON_VAR_RT_MAP[beaconProp] + "=" + resTime
								+ " (" + b.u + ")");
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

	it("Should have set t_done = rt.end - nt_fet_st for the XHR beacons (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
			for (var k in XHR_BEACONS) {
				if (XHR_BEACONS.hasOwnProperty(k)) {
					var i = XHR_BEACONS[k];
					var b = tf.beacons[i];
					assert.equal(b.t_done, b["rt.end"] - b.nt_fet_st);
				}
			}
		}
	});

	it("Should have set t_resp = nt_res_end - nt_fet_st for the XHR beacons (if AutoXHR is enabled)", function() {
		if (BOOMR.plugins.AutoXHR) {
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
					assert.equal(b.t_page, b.t_done - b.t_resp);
				}
			}
		}
	});

	//
	// Test all Hard Beacons
	//
	it("Should have set http.initiator = 'spa_hard' on the first SPA beacon", function() {
		if (BOOMR.plugins.AutoXHR) {
			for (var k in SPA_HARD_BEACONS) {
				if (SPA_HARD_BEACONS.hasOwnProperty(k)) {
					var i = SPA_HARD_BEACONS[k];
					var b = tf.beacons[i];
					assert.equal(b["http.initiator"], "spa_hard");
				}
			}
		}
	});

	//
	// Test all Soft Beacons
	//
	it("Should have set http.initiator = 'spa' on the next SPA beacons", function() {
		if (BOOMR.plugins.AutoXHR) {
			for (var k in SPA_BEACONS) {
				if (SPA_BEACONS.hasOwnProperty(k)) {
					var i = SPA_BEACONS[k];
					var b = tf.beacons[i];
					assert.equal(b["http.initiator"], "spa");
				}
			}
		}
	});
};
