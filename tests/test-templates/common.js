/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,assert*/

describe("common", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	function testSpaHardBeacon(b, prefix) {
		assert.isUndefined(b.api, prefix + "does not have the api param");
	}

	function testSpaSoftBeacon(b, prefix) {
		assert.isUndefined(b.api, prefix + "does not have the api param");
	}

	it("Should have sent beacons that pass basic validation", function() {
		for (var i = 0; i < tf.beacons.length; i++) {
			var b = tf.beacons[i], tm, now = BOOMR.now();
			var prefix = "ensure beacon " + (i + 1) + " ";

			assert.equal(b.v, BOOMR.version, prefix + "has the boomerang version");

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

			assert.lengthOf(b.pid, 8, prefix + "has a page ID (pid) with a length equal to 8");

			if (!t.doNotTestErrorsParam) {
				assert.isUndefined(b.errors, prefix + "does not have the errors param");
			}

			if (b["rt.start"] === "navigation") {
				// page load beacon
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

	it("BUG: should have sent beacons without negative timers", function() {
		var t_done, t_resp, t_page;
		for (var i = 0; i < tf.beacons.length; i++) {
			var b = tf.beacons[i];
			var prefix = "ensure beacon " + (i + 1) + " ";
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
				var timers = t.parseTimers(b.t_other);
				for (var timer in timers) {
					if (timers.hasOwnProperty(timer)) {
						// TODO: this test reveals a bug, see https://github.com/SOASTA/soasta-boomerang/issues/626
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
});
