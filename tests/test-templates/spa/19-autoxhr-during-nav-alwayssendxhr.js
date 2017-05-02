
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
	var BEACONS_SENT_SPA = 2;
	var BEACONS_SENT_SPA_HARD = 1;
	var BEACONS_SENT_XHR = 5;

	//
	// Beacons probably come in in the above order, but for non-MutationObserver clients,
	// they may be slightly out of order.  Iterate over all beacons first to bucket them.
	//
	function getBeaconByType() {
		var beacons = { "spa_hard": [], "spa": [], "xhr": []};
		for (var type in beacons) {
			if (beacons.hasOwnProperty(type)) {
				for (var j = 0; j < tf.beacons.length; j++) {
					var beacon = tf.beacons[j];
					if (beacon["http.initiator"] === type) {
						beacons[type].push(beacon);
					}
				}
			}
		}

		return beacons;
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

	it("Should have sent " + BEACONS_SENT_SPA + " spa beacons (AutoXHR is enabled and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && window.MutationObserver) {
			assert.equal(getBeaconByType().spa.length, BEACONS_SENT_SPA);
		}
	});

	it("Should have sent " + BEACONS_SENT_SPA_HARD + " spa_hard beacons (AutoXHR is enabled and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && window.MutationObserver) {
			assert.equal(getBeaconByType().spa_hard.length, BEACONS_SENT_SPA_HARD);
		}
	});

	it("Should have sent " + BEACONS_SENT_XHR + " xhr beacons (AutoXHR is enabled and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && window.MutationObserver) {
			assert.equal(getBeaconByType().xhr.length, BEACONS_SENT_XHR);
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
			var beacons = getBeaconByType();
			for (var k in beacons.xhr) {
				if (beacons.xhr.hasOwnProperty(k)) {
					assert.equal(beacons.xhr[k]["http.initiator"], "xhr", "XHR for beacon #" + k);
				}
			}
		}
	});

	it("Should have set rt.start = 'manual' on the XHR beacons (if AutoXHR is enabled and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && window.MutationObserver) {
			var beacons = getBeaconByType();
			for (var k in beacons.xhr) {
				if (beacons.xhr.hasOwnProperty(k)) {
					assert.equal(beacons.xhr[k]["rt.start"], "manual");
				}
			}
		}
	});

	it("Should have set beacon's nt_* timestamps accurately (if AutoXHR is enabled and NavigationTiming is supported and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && t.isNavigationTimingSupported() && window.MutationObserver) {
			var beacons = getBeaconByType();
			for (var k in beacons.xhr) {
				if (beacons.xhr.hasOwnProperty(k)) {
					var b = beacons.xhr[k];

					var res = t.findFirstResource(b.u);
					var st = BOOMR.window.performance.timing.navigationStart;

					for (var beaconProp in BEACON_VAR_RT_MAP) {
						var resTime = Math.round(res[BEACON_VAR_RT_MAP[beaconProp]] + st);

						assert.equal(
							b[beaconProp],
							resTime,
							"Beacon #" + k + ": " + beaconProp + "=" + b[beaconProp] +
								" vs " + BEACON_VAR_RT_MAP[beaconProp] + "=" + resTime +
								" (" + b.u + ")");
					}
				}
			}
		}
	});

	it("Should have set pgu = the page's location on the XHR beacons (if AutoXHR is enabled and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && window.MutationObserver) {
			var beacons = getBeaconByType();
			for (var k in beacons.xhr) {
				if (beacons.xhr.hasOwnProperty(k)) {
					assert.include(BOOMR.window.location.href, beacons.xhr[k].pgu);
				}
			}
		}
	});

	it("Should have set nt_load_end==nt_load_st==rt.end on the XHR beacons (if AutoXHR is enabled and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && window.MutationObserver) {
			var beacons = getBeaconByType();
			for (var k in beacons.xhr) {
				if (beacons.xhr.hasOwnProperty(k)) {
					var b = beacons.xhr[k];

					assert.equal(b.nt_load_end, b.nt_load_st);
					assert.equal(b.nt_load_end, b["rt.end"]);
				}
			}
		}
	});

	it("Should have set t_done = rt.end - nt_fet_st for the XHR beacons (if AutoXHR is enabled and NavigationTiming is supported and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && t.isNavigationTimingSupported() && window.MutationObserver) {
			var beacons = getBeaconByType();
			for (var k in beacons.xhr) {
				if (beacons.xhr.hasOwnProperty(k)) {
					var b = beacons.xhr[k];
					assert.equal(b.t_done, b["rt.end"] - b.nt_fet_st);
				}
			}
		}
	});

	it("Should have set t_resp = nt_res_end - nt_fet_st for the XHR beacons (if AutoXHR is enabled and NavigationTiming is supported and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && t.isNavigationTimingSupported() && window.MutationObserver) {
			var beacons = getBeaconByType();
			for (var k in beacons.xhr) {
				if (beacons.xhr.hasOwnProperty(k)) {
					var b = beacons.xhr[k];
					assert.equal(b.t_resp, b.nt_res_end - b.nt_fet_st);
				}
			}
		}
	});

	it("Should have set t_page = t_done - t_resp for the XHR beacons (if AutoXHR is enabled and MutationObserver is supported)", function() {
		if (BOOMR.plugins.AutoXHR && window.MutationObserver) {
			var beacons = getBeaconByType();
			for (var k in beacons.xhr) {
				if (beacons.xhr.hasOwnProperty(k)) {
					var b = beacons.xhr[k];
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
			var beacons = getBeaconByType();
			for (var k in beacons.spa_hard) {
				if (beacons.spa_hard.hasOwnProperty(k)) {
					var b = beacons.spa_hard[k];
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
			var beacons = getBeaconByType();
			for (var k in beacons.spa) {
				if (beacons.spa.hasOwnProperty(k)) {
					var b = beacons.spa[k];
					assert.equal(b["http.initiator"], "spa");
				}
			}
		}
	});
};
