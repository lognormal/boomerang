
/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["19-autoxhr-during-nav-alwayssendxhr"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	//
	// Beacon order:
	//
	// home.html
	// widgets.json
	// spa_hard
	// widget.html
	// widget.json
	// spa
	// widgets.json
	// spa
	//
	// Note this scenario changes a bit if MutationObserver isn't supported.
	//
	var BEACONS_SENT = 8;

	//
	// Beacons probably come in in the above order, but for non-MutationObserver clients,
	// they may be slightly out of order.  Iterate over all beacons first to bucket them.
	//
	var BEACONS = { "spa_hard" : {}, "spa": {}, "xhr": {}};
	for (var type in BEACONS) {
		if (BEACONS.hasOwnProperty(type)) {
			for (var j = 0; j < tf.beacons.length; j++) {
				BEACONS[tf.beacons["http.initiator"]].push(j);
			}
		}
	}

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

	it("Should have sent " + BEACONS_SENT + " beacons (AutoXHR is enabled and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && window.MutationObserver) {
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
	it("Should have set http.initiator = 'xhr' on the XHR beacons (if AutoXHR is enabled and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && window.MutationObserver) {
			for (var k in BEACONS.xhr) {
				if (BEACONS.xhr.hasOwnProperty(k)) {
					var i = BEACONS.xhr[k];
					assert.equal(tf.beacons[i]["http.initiator"], "xhr", "XHR for beacon #" + i);
				}
			}
		}
	});

	it("Should have set rt.start = 'manual' on the XHR beacons (if AutoXHR is enabled and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && window.MutationObserver) {
			for (var k in BEACONS.xhr) {
				if (BEACONS.xhr.hasOwnProperty(k)) {
					var i = BEACONS.xhr[k];
					assert.equal(tf.beacons[i]["rt.start"], "manual");
				}
			}
		}
	});

	it("Should have set beacon's nt_* timestamps accurately (if AutoXHR is enabled and NavigationTiming is supported and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && t.isNavigationTimingSupported() && window.MutationObserver) {
			for (var k in BEACONS.xhr) {
				if (BEACONS.xhr.hasOwnProperty(k)) {
					var i = BEACONS.xhr[k];
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

	it("Should have set pgu = the page's location on the XHR beacons (if AutoXHR is enabled and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && window.MutationObserver) {
			for (var k in BEACONS.xhr) {
				if (BEACONS.xhr.hasOwnProperty(k)) {
					var i = BEACONS.xhr[k];
					assert.include(BOOMR.window.location.href, tf.beacons[i].pgu);
				}
			}
		}
	});

	it("Should have set nt_load_end==nt_load_st==rt.end on the XHR beacons (if AutoXHR is enabled and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && window.MutationObserver) {
			for (var k in BEACONS.xhr) {
				if (BEACONS.xhr.hasOwnProperty(k)) {
					var i = BEACONS.xhr[k];
					var b = tf.beacons[i];

					assert.equal(b.nt_load_end, b.nt_load_st);
					assert.equal(b.nt_load_end, b["rt.end"]);
				}
			}
		}
	});

	it("Should have set t_done = rt.end - nt_fet_st for the XHR beacons (if AutoXHR is enabled and NavigationTiming is supported and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && t.isNavigationTimingSupported() && window.MutationObserver) {
			for (var k in BEACONS.xhr) {
				if (BEACONS.xhr.hasOwnProperty(k)) {
					var i = BEACONS.xhr[k];
					var b = tf.beacons[i];
					assert.equal(b.t_done, b["rt.end"] - b.nt_fet_st);
				}
			}
		}
	});

	it("Should have set t_resp = nt_res_end - nt_fet_st for the XHR beacons (if AutoXHR is enabled and NavigationTiming is supported and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && t.isNavigationTimingSupported() && window.MutationObserver) {
			for (var k in BEACONS.xhr) {
				if (BEACONS.xhr.hasOwnProperty(k)) {
					var i = BEACONS.xhr[k];
					var b = tf.beacons[i];
					assert.equal(b.t_resp, b.nt_res_end - b.nt_fet_st);
				}
			}
		}
	});

	it("Should have set t_page = t_done - t_resp for the XHR beacons (if AutoXHR is enabled and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && window.MutationObserver) {
			for (var k in BEACONS.xhr) {
				if (BEACONS.xhr.hasOwnProperty(k)) {
					var i = BEACONS.xhr[k];
					var b = tf.beacons[i];
					assert.equal(b.t_page, b.t_done - b.t_resp);
				}
			}
		}
	});

	//
	// Test all Hard Beacons
	//
	it("Should have set http.initiator = 'spa_hard' on the first SPA beacon (if MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && window.MutationObserver) {
			for (var k in BEACONS.spa_hard) {
				if (BEACONS.spa_hard.hasOwnProperty(k)) {
					var i = BEACONS.spa_hard[k];
					var b = tf.beacons[i];
					assert.equal(b["http.initiator"], "spa_hard");
				}
			}
		}
	});

	//
	// Test all Soft Beacons
	//
	it("Should have set http.initiator = 'spa' on the next SPA beacons (if MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && window.MutationObserver) {
			for (var k in BEACONS.spa) {
				if (BEACONS.spa.hasOwnProperty(k)) {
					var i = BEACONS.spa[k];
					var b = tf.beacons[i];
					assert.equal(b["http.initiator"], "spa");
				}
			}
		}
	});
};
