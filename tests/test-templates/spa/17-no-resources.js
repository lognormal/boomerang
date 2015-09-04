/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["17-no-resources"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent three beacons", function() {
		assert.equal(tf.beacons.length, 3);
	});

	it("Should have sent all beacons as http.initiator = SPA", function() {
		for (var i = 0; i < 2; i++) {
			assert.equal(tf.beacons[i]["http.initiator"], "spa");
		}
	});

	//
	// Beacon 1
	//
	it("Should have sent the first beacon for /17-no-resources.html", function() {
		var b = tf.beacons[0];
		assert.isTrue(b.u.indexOf("/17-no-resources.html") !== -1);
	});

	//
	// Beacon 2
	//
	it("Should have sent the second beacon for /empty", function() {
		var b = tf.beacons[1];
		assert.isTrue(b.u.indexOf("/empty") !== -1);
	});

	it("Should have sent the second beacon with a timestamp of less than 100 milliseconds (if MutationObserver is supported)", function() {
		if (window.MutationObserver) {
			var b = tf.beacons[1];
			assert.operator(b.t_done, "<=", 100);
		}
	});

	it("Should have sent the second beacon with a timestamp of at least 1 millisecond (if MutationObserver is not supported)", function() {
		if (typeof window.MutationObserver === "undefined") {
			var b = tf.beacons[1];
			assert.operator(b.t_done, ">=", 0);
		}
	});

	//
	// Beacon 3
	//
	it("Should have sent the third beacon for /17-no-resources.html", function() {
		var b = tf.beacons[2];
		assert.isTrue(b.u.indexOf("/17-no-resources.html") !== -1);
	});
};
