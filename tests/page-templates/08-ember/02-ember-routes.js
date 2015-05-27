/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/08-ember/02-ember-routes", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent 5 beacons (1 init, widgets, widget/{1,2,3})", function() {
		assert.equal(tf.beacons.length, 5);
	});

	it("Should have sent all beacons as http.initiator = SPA", function() {
		for (var i = 0; i < 2; i++) {
			assert.equal(tf.beacons[i]["http.initiator"], "spa");
		}
	});

	//
	// Beacon 1
	//
	it("Should have sent the first beacon for /02-ember-routes.html", function() {
		var b = tf.beacons[0];
		assert.isTrue(b.u.indexOf("/02-ember-routes.html") !== -1);
	});

	it("Should take as long as the longest img load (if MutationObserver and NavigationTiming are supported)", function() {
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			t.validateBeaconWasSentAfter(4, "img.jpg&id=3", 3000, 5000, 30000);
		}
	});

	it("Should not have a load time (if MutationObserver is supported but NavigationTiming is not)", function() {
		if (window.MutationObserver && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
			var b = tf.beacons[1];
			assert.equal(b.t_done, undefined);
		}
	});

	it("Should take as long as the XHRs (if MutationObserver is not supported but NavigationTiming is)", function() {
		if (typeof window.MutationObserver === "undefined" && typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
			t.validateBeaconWasSentAfter(0, "widgets.json", 500, 0, 30000, false);
		}
	});

	it("Shouldn't have a load time (if MutationObserver and NavigationTiming are not supported)", function() {
		if (typeof window.MutationObserver === "undefined" && typeof BOOMR.plugins.RT.navigationStart() === "undefined") {
			var b = tf.beacons[0];
			assert.equal(b.t_done, undefined);
			assert.equal(b["rt.start"], "manual");
		}
	});

	//
	// Beacon 2
	//
	it("Should have sent the second beacon for /widgets", function() {
		var b = tf.beacons[1];
		assert.isTrue(b.u.indexOf("/widgets") !== -1);
	});

	//
	// Beacon 3
	//
	it("Should have sent the second beacon with a timestamp of at least 1 second (if MutationObserver is supported)", function() {
		if (window.MutationObserver) {
			// because of the widget IMG delaying 1 second
			var b = tf.beacons[2];
			assert.operator(b.t_done, ">=", 1000);
		}
	});

	it("Should have sent the second beacon with a timestamp of at least 1 millisecond (if MutationObserver is not supported)", function() {
		if (typeof window.MutationObserver === "undefined") {
			// because of the widget IMG delaying 1 second but we couldn't track it because no MO support
			var b = tf.beacons[2];
			assert.operator(b.t_done, ">=", 0);
		}
	});

	//
	// Beacon 4
	//
	it("Should have sent the third beacon for /02-ember-routes.html", function() {
		var b = tf.beacons[2];
		assert.isTrue(b.u.indexOf("/02-ember-routes.html") !== -1);
	});

	it("Should have sent the third with a timestamp of less than 5 seconds (~500ms initial page load + 1500ms xhr/template + 2500ms xhr/template/delay )", function() {
		// now that the initial page is cached, it should be a quick navigation
		var b = tf.beacons[2];
		assert.operator(b.t_done, "<=", 5000);
	});
});
