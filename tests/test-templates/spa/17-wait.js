/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["17-wait"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent four beacons", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 4);
	});

	it("Should have sent the first beacon as http.initiator = spa_hard", function() {
		assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
	});

	it("Should have sent all subsequent beacons as http.initiator = spa", function() {
		for (var i = 1; i < 3; i++) {
			assert.equal(tf.beacons[i]["http.initiator"], "spa");
		}
	});

	//
	// Beacon 1
	//
	describe("Beacon 1 (spa_hard)", function() {
		var i = 0;
		it("Should have sent the first beacon for *-wait.html", function() {
			var b = tf.beacons[i];
			assert.isTrue(b.u.indexOf("-wait.html") !== -1);
		});

		it("Should have sent the first beacon without an additional wait (if ResourceTiming is supported)", function() {
			if (t.isResourceTimingSupported()) {
				var b = tf.beacons[i];
				// t_done should be close to the end time of the first request for widgets.json
				var r = t.findFirstResource("widgets.json");
				assert.isDefined(b.t_done);
				assert.closeTo(r.responseEnd /* HR timestamp */, b.t_done, 100);
			}
			else {
				this.skip();
			}
		});
	});

	//
	// Beacon 2
	//
	describe("Beacon 2 (spa)", function() {
		var i = 1;
		it("Should have sent the second beacon for /widgets/1", function() {
			var b = tf.beacons[i];
			assert.isTrue(b.u.indexOf("/widgets/1") !== -1);
		});

		it("Should have sent the second beacon with the time it took to run the 5 second wait", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.operator(tf.beacons[i].t_done, ">=", 5000);
					assert.operator(tf.beacons[i].t_done, "<", 5300);
					done();
				},
				this.skip.bind(this));
		});

		it("Should have sent the second beacon with the end time (rt.end) of when the 5 second wait fired", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.closeTo(tf.beacons[i]["rt.end"], window.spaWaitCompleteTimes[i - 1], 100);
					done();
				},
				this.skip.bind(this));
		});
	});

	//
	// Beacon 3
	//
	describe("Beacon 3 (spa)", function() {
		var i = 2;
		it("Should have sent the third beacon for /widgets/2", function() {
			var b = tf.beacons[i];
			assert.isTrue(b.u.indexOf("/widgets/2") !== -1);
		});

		it("Should have sent the third with a timestamp of at least 2s (if MutationObserver is supported)", function(done) {
			if (t.isMutationObserverSupported()) {
				t.ifAutoXHR(
					done,
					function() {
						assert.operator(tf.beacons[i].t_done, ">=", 2000);
						assert.operator(tf.beacons[i].t_done, "<", 2550);  // depending on app, could be up to 250ms xhr and 2s img
						done();
					},
					this.skip.bind(this));
			}
			else {
				return this.skip();
			}
		});

		it("Should have sent the third with a timestamp of at least 1ms (if MutationObserver is not supported)", function(done) {
			if (!t.isMutationObserverSupported()) {
				t.ifAutoXHR(
					done,
					function() {
						assert.operator(tf.beacons[i].t_done, ">=", 1);
						assert.operator(tf.beacons[i].t_done, "<", 300);
						done();
					},
					this.skip.bind(this));
			}
			else {
				return this.skip();
			}
		});

	});

	//
	// Beacon 4
	//
	describe("Beacon 4 (spa)", function() {
		var i = 3;
		it("Should have sent the fourth beacon for *-wait.html", function() {
			var b = tf.beacons[i];
			assert.isTrue(b.u.indexOf("-wait.html") !== -1);
		});

		it("Should have sent the fourth beacon with a timestamp of less than 1 second", function() {
			// now that the initial page is cached, it should be a quick navigation
			var b = tf.beacons[i];
			assert.operator(b.t_done, "<=", 1000);
		});
	});
};
