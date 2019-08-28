/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,assert*/

describe("common", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;
	var assert = window.chai.assert;

	// Get a performance.now() polyfill that doesn't rely on BOOMR.now
	var dateNow =
		(function() {
			return Date.now || function() { return new Date().getTime(); };
		}());
	var perfNow = dateNow;

	if ("performance" in window && window.performance && typeof window.performance.now === "function") {
		perfNow = function() {
			if (window.performance && typeof window.performance.now === "function" && !window.performance.now.isCustom) {
				return Math.round(window.performance.now() + window.performance.timing.navigationStart);
			}
			else {
				// might've been deleted via BOOMR_test.removeNavigationTimingSupport()
				return dateNow();
			}
		};
	}

	function testPageLoadBeacon(b, prefix) {
		// TODO
		assert.isUndefined(b.pgu, prefix + "does not have the pgu param");
		assert.isUndefined(b["xhr.pg"], prefix + "does not have the xhr.pg param");
	}

	function testSpaHardBeacon(b, prefix) {
		assert.isUndefined(b.api, prefix + "does not have the api param");
		assert.isUndefined(b["xhr.pg"], prefix + "does not have the xhr.pg param");
		if (!t.doNotTestSpaAbort) {
			assert.isUndefined(b["rt.abld"], prefix + "does not have the rt.abld param");
			assert.isUndefined(b["rt.quit"], prefix + "does not have the rt.quit param");
		}
	}

	function testSpaSoftBeacon(b, prefix) {
		assert.isUndefined(b.api, prefix + "does not have the api param");
		assert.isUndefined(b["xhr.pg"], prefix + "does not have the xhr.pg param");
		if (!t.doNotTestSpaAbort) {
			assert.isUndefined(b["rt.abld"], prefix + "does not have the rt.abld param");
			assert.isUndefined(b["rt.quit"], prefix + "does not have the rt.quit param");
		}
	}

	function testXhrBeacon(b, prefix) {
		assert.isUndefined(b.api, prefix + "does not have the api param");
		assert.isDefined(b.pgu, prefix + "has the pgu param");
		assert.isUndefined(b["h.pg"], prefix + "does not have the h.pg param");
	}

	it("Should have sent beacons that pass basic validation", function() {
		var i, b, tm, now, prefix;

		if (!tf.beacons.length) {
			return this.skip();
		}

		for (i = 0; i < tf.beacons.length; i++) {
			b = tf.beacons[i];
			now = perfNow();
			prefix = "ensure beacon " + (i + 1) + " ";

			assert.equal(b.n, i + 1, prefix + "has the correct beacon number");

			assert.equal(b.v, BOOMR.version, prefix + "has the boomerang version");

			if (BOOMR.snippetVersion) {
				assert.equal(b.sv, BOOMR.snippetVersion, prefix + "has the boomerang snippet version");
			}

			if (BOOMR.snippetMethod) {
				assert.equal(b.sm, BOOMR.snippetMethod, prefix + "has the boomerang snippet method");
			}

			assert.equal(b["h.key"], window.BOOMR_API_key, prefix + "has the correct API key (h.key)");
			assert.isDefined(b["h.d"], prefix + "has the domain (h.d) param");

			assert.isDefined(b["h.t"], prefix + "has the time (h.t) param");
			tm = parseInt(b["h.t"], 10);
			assert.operator(tm, ">", now - (60 * 1000), prefix + "time is greater than a minute ago");
			assert.operator(tm, "<", now, prefix + "time is less than now");

			if (window.BOOMR_LOGN_always !== true) {
				assert.equal(b["h.cr"], "abc", prefix + "has the correct crumb (h.cr)");
			}
			else {
				assert.isDefined(b["h.cr"], prefix + "has the crumb (h.cr)");
			}

			if (!t.doNotTestErrorsParam) {
				assert.isUndefined(b.errors, prefix + "does not have the errors param");
			}

			if (b["rt.start"] === "navigation") {
				// page load beacon
				testPageLoadBeacon(b, prefix);
			}
			else if (b["rt.start"] === "manual") {
				if (b["http.initiator"] === "spa_hard") {
					// spa hard beacon
					testSpaHardBeacon(b, prefix);
				}
				else if (b["http.initiator"] === "spa") {
					// spa soft beacon
					testSpaSoftBeacon(b, prefix);
				}
				else if (b["http.initiator"] === "xhr") {
					// xhr beacon
					testXhrBeacon(b, prefix);
				}
				else if (b["http.initiator"] === "click") {
					// click (AutoXHR) beacon
					assert.isUndefined(b.api, prefix + "does not have the api param");
					assert.isDefined(b.pgu, prefix + "has the pgu param");
				}
				else if (b["http.initiator"] === "api_custom_metric") {
					// send metric beacon
					assert.equal(b.api, "1", prefix + "has the api param value equal to 1");
					assert.equal(b["api.v"], "2", prefix + "has api version equal to 2");
					assert.equal(b["api.l"], "boomr", prefix + "has the api source equal to boomr");
				}
				else if (b["http.initiator"] === "api_custom_timer") {
					// send timer beacon
					assert.equal(b.api, "1", prefix + "has the api param value equal to 1");
					assert.equal(b["api.v"], "2", prefix + "has api version equal to 2");
					assert.equal(b["api.l"], "boomr", prefix + "has the api source equal to boomr");
				}
				else if (b["http.initiator"] === "error") {
					// error beacon
					assert.equal(b.api, "1", prefix + "has the api param value equal to 1");
				}
				else if (b["http.initiator"] === "interaction") {
					// Interaction beacon
					// nothing special
				}
				else if (typeof b["http.initiator"] === "undefined") {
					// requestStart and/or responseEnd initiated beacon
					// TODO
				}
				else {
					// invalid
					assert.fail(prefix + "with a rt.start=manual has a valid http.initiator, was:" + b["http.initiator"]);
				}
			}
			else if (b["rt.start"] === "none") {
				if (b["http.initiator"] === "spa_hard") {
					// spa hard beacon
					testSpaHardBeacon(b, prefix);
				}
				else if (b["http.initiator"] === "spa") {
					// spa soft beacon
					testSpaSoftBeacon(b, prefix);
				}
				else {
					// TODO
				}
			}
			else if (b["rt.start"] === "cookie") {
				// TODO
			}
			else if (b["rt.start"] === "csi") {
				// TODO
			}
			else if (b["rt.start"] === "gtb") {
				// TODO
			}
			else if (typeof b["rt.start"] === "undefined") {
				if (b["http.initiator"] === "error") {
					// error beacon
					assert.equal(b.api, "1", prefix + "has the api param value equal to 1");
				}
				else if (b["rt.quit"] !== "undefined") {
					// unload beacon
				}
				else {
					// invalid
					assert.fail(prefix + "has a valid rt.start, was:" + b["rt.start"]);
				}
			}
			else {
				// invalid
				assert.fail(prefix + "has a valid rt.start, was: " + b["rt.start"]);
			}
		}
	});

	it("Should have sent beacons with the same Page ID (pid)", function() {
		var pid, i, prefix, b;
		if (!tf.beacons.length) {
			return this.skip();
		}

		pid = tf.beacons[0].pid;
		for (i = 0; i < tf.beacons.length; i++) {
			b = tf.beacons[i];
			prefix = "ensure beacon " + (i + 1) + " ";
			assert.lengthOf(b.pid, 8, prefix + "has a page ID (pid) with a length equal to 8");
			assert.equal(b.pid, pid, prefix + "has the same pid as first beacon");
		}
	});

	it("BUG: should have sent beacons without negative timers", function() {
		var i, b, prefix, t_done, t_resp, t_page, timers, timer;

		if (!tf.beacons.length) {
			return this.skip();
		}

		for (i = 0; i < tf.beacons.length; i++) {
			b = tf.beacons[i];
			prefix = "ensure beacon " + (i + 1) + " ";
			if (b.t_done) {
				t_done = parseInt(b.t_done, 10);
				assert.operator(t_done, ">=", 0, prefix + "has a positive 't_done' timer");
			}

			if (b.t_resp) {
				t_resp = parseInt(b.t_resp, 10);
				assert.operator(t_resp, ">=", 0, prefix + "has a positive 't_resp' timer");
			}

			if (b.t_page) {
				t_page = parseInt(b.t_page, 10);
				assert.operator(t_page, ">=", 0, prefix + "has a positive 't_page' timer");
			}

			if (b.t_other) {
				timers = t.parseTimers(b.t_other);
				for (timer in timers) {
					if (timers.hasOwnProperty(timer)) {
						// TODO: this test reveals a bug, see Issue #626
						//assert.isTrue(timers[timer] >= 0, prefix + "has a positive 't_other." + timer + "' timer");
						if (timers[timer] < 0) {
							return this.skip();
						}
						if (b[timer + "_st"]) {
							assert.operator(parseInt(b[timer + "_st"], 10), ">=", 0, prefix + "has a positive '" + timer + "_st' value");
						}
					}
				}
			}
		}
	});

	it("AutoXHR: Should not have pending events", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var events = BOOMR.plugins.AutoXHR.getMutationHandler().pending_events;
				events = BOOMR.utils.arrayFilter(events, function(val) { return typeof val !== "undefined"; });
				assert.lengthOf(events, 0);
				done();
			},
			this.skip.bind(this)
		);
	});
});
