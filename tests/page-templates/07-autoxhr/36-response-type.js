/*eslint-env mocha*/
/*global assert,it,describe*/

describe("e2e/07-autoxhr/36-response-type", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 3 beacons: 1 onload, 2 xhr (XMLHttpRequest !== null)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 3);
			});
	});

	it("Should have the first beacon be a page load beacon", function() {
		if (t.isNavigationTimingSupported()) {
			assert.equal(tf.beacons[0]["rt.start"], "navigation");
		}
		else {
			assert.equal(tf.beacons[0]["rt.start"], "none");
		}
	});

	it("Should have the first beacon not have a http.initiator", function() {
		assert.isUndefined(tf.beacons[0]["http.initiator"]);
	});

	it("Should have the first beacon have the URL of the page", function() {
		assert.equal(tf.beacons[0].u, window.location.href);
	});

	it("Should have the second beacon have http.initiator = 'xhr'", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.equal(tf.beacons[1]["http.initiator"], "xhr");

				done();
			});
	});

	it("Should have the second beacon have URL of the XHR", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.include(tf.beacons[1].u, "support/data.json");

				done();
			});
	});

	it("Should have the second beacon have pgu of the XHR", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.equal(tf.beacons[1].pgu, window.location.href);

				done();
			});
	});

	it("Should have the second beacon have t_done of less than 500ms", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.operator(parseInt(tf.beacons[1].t_done, 10), "<", 500);

				done();
			});
	});

	it("Should have the third beacon have http.initiator = 'xhr'", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.equal(tf.beacons[2]["http.initiator"], "xhr");

				done();
			});
	});

	it("Should have the third beacon have URL of the XHR", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.include(tf.beacons[2].u, "support/data.xml");

				done();
			});
	});

	it("Should have the third beacon have pgu of the XHR", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.equal(tf.beacons[2].pgu, window.location.href);

				done();
			});
	});

	it("Should have the third beacon have t_done of less than 500ms", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.operator(parseInt(tf.beacons[2].t_done, 10), "<", 500);

				done();
			});
	});

	it("Should have not had any errors", function() {
		assert.equal(window.errorCount, 0);
	});
});
