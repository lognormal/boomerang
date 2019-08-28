/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["24-route-filter"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	var pathName = window.location.pathname;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent three beacons", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 3);
	});

	//
	// Beacon 1
	//
	describe("Beacon 1 (spa_hard)", function() {
		var i = 0;

		it("Should have sent the first beacon as http.initiator = spa_hard", function() {
			assert.equal(tf.beacons[i]["http.initiator"], "spa_hard");
		});

		it("Should have sent the first beacon for " + pathName, function() {
			var b = tf.beacons[i];
			assert.isTrue(b.u.indexOf(pathName) !== -1);
		});

		it("Should take as long as the longest img load (if MutationObserver and NavigationTiming are supported)", function() {
			if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
				t.validateBeaconWasSentAfter(i, "img.jpg&id=home", 500, 3000, 30000, 0);
			}
			else {
				return this.skip();
			}
		});

		it("Should not have a load time (if MutationObserver is supported but NavigationTiming is not)", function() {
			if (t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
				var b = tf.beacons[i];
				assert.equal(b.t_done, undefined);
			}
			else {
				return this.skip();
			}
		});

		it("Should take as long as the XHRs (if MutationObserver is not supported but NavigationTiming is)", function() {
			if (!t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
				t.validateBeaconWasSentAfter(i, "widgets.json", 500, 0, 30000, false);
			}
			else {
				return this.skip();
			}
		});

		it("Shouldn't have a load time (if MutationObserver and NavigationTiming are not supported)", function() {
			if (!t.isMutationObserverSupported() && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
				var b = tf.beacons[i];
				assert.equal(b.t_done, undefined);
				assert.equal(b["rt.start"], "none");
			}
			else {
				return this.skip();
			}
		});
	});

	//
	// Beacon 2
	//
	describe("Beacon 2 (spa)", function() {
		var i = 1;

		it("Should have sent second beacon as http.initiator = spa", function() {
			assert.equal(tf.beacons[i]["http.initiator"], "spa");
		});

		it("Should have sent the second beacon for /widgets/1", function() {
			var b = tf.beacons[i];
			assert.isTrue(b.u.indexOf("/widgets/1") !== -1);
		});

		it("Should have sent the second beacon with a timestamp of at least 1 second (if MutationObserver is supported)", function() {
			if (t.isMutationObserverSupported()) {
				// because of the widget IMG delaying 1 second
				var b = tf.beacons[i];
				assert.operator(b.t_done, ">=", 1000);
			}
			else {
				return this.skip();
			}
		});

		it("Should have sent the second beacon with a timestamp of at least 1 millisecond (if MutationObserver is not supported)", function() {
			if (!t.isMutationObserverSupported()) {
				// because of the widget IMG delaying 1 second but we couldn't track it because no MO support
				var b = tf.beacons[i];
				assert.operator(b.t_done, ">=", 0);
			}
			else {
				return this.skip();
			}
		});
	});

	//
	// Beacon 3
	//
	describe("Beacon 3 (xhr)", function() {
		var i = 2;

		it("Should have sent third beacon as http.initiator = xhr", function() {
			assert.equal(tf.beacons[i]["http.initiator"], "xhr");
		});

		it("Should have sent the second beacon for widgets.json", function() {
			var b = tf.beacons[i];
			assert.isTrue(b.u.indexOf("support/widgets.json") !== -1);
		});
	});
};
