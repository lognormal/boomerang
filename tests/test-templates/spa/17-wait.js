/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["17-wait"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent four beacons", function() {
		assert.equal(tf.beacons.length, 4);
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
	// Beacon 1 (page load)
	//
	it("Should have sent the first beacon for /17-wait.html", function() {
		var b = tf.beacons[0];
		assert.isTrue(b.u.indexOf("/17-wait.html") !== -1);
	});

	it("Should have sent the first beacon with the time it took to run the 5 second wait (if MutationObserver is supported)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				if (window.MutationObserver) {
					assert.operator(tf.beacons[0].t_done, ">=", 5000);
				}
				done();
			});
	});

	it("Should have sent the first beacon with the end time (rt.end) of when the 5 second wait fired", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.closeTo(tf.beacons[0]["rt.end"], window.spaWaitCompleteTimes[0], 100);
				done();
			});
	});

	//
	// Beacon 2
	//
	it("Should have sent the second beacon for /widgets/1", function() {
		var b = tf.beacons[1];
		assert.isTrue(b.u.indexOf("/widgets/1") !== -1);
	});

	it("Should have sent the second beacon with the time it took to run the 5 second wait", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.operator(tf.beacons[1].t_done, ">=", 5000);
				done();
			});
	});

	it("Should have sent the second beacon with the end time (rt.end) of when the 5 second wait fired", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.closeTo(tf.beacons[1]["rt.end"], window.spaWaitCompleteTimes[1], 100);
				done();
			});
	});

	//
	// Beacon 3
	//
	it("Should have sent the third beacon for /widgets/2", function() {
		var b = tf.beacons[2];
		assert.isTrue(b.u.indexOf("/widgets/2") !== -1);
	});

	it("Should have sent the third beacon with a timestamp of at least 1 second (if MutationObserver is supported)", function() {
		if (window.MutationObserver) {
			// because of the widget IMG delaying 1 second
			var b = tf.beacons[2];
			assert.operator(b.t_done, ">=", 1000);
		}
	});

	it("Should have sent the third beacon with a timestamp of at least 1 millisecond (if MutationObserver is not supported)", function() {
		if (typeof window.MutationObserver === "undefined") {
			// because of the widget IMG delaying 1 second but we couldn't track it because no MO support
			var b = tf.beacons[2];
			assert.operator(b.t_done, ">=", 0);
		}
	});

	it("Should have sent the third beacon with the end time (rt.end) different from when the 1ms wait fired (if MutationObserver is supported)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				if (window.MutationObserver) {
					assert.operator(tf.beacons[2]["rt.end"], ">=", window.spaWaitCompleteTimes[2] + 10);
				}
				done();
			});
	});

	//
	// Beacon 4
	//
	it("Should have sent the fourth beacon for /17-wait.html", function() {
		var b = tf.beacons[3];
		assert.isTrue(b.u.indexOf("/17-wait.html") !== -1);
	});

	it("Should have sent the fourth beacon with a timestamp of less than 1 second", function() {
		// now that the initial page is cached, it should be a quick navigation
		var b = tf.beacons[3];
		assert.operator(b.t_done, "<=", 1000);
	});
};
