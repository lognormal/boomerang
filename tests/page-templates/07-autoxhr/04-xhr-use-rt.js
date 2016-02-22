/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/04-xhr-use-rt", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	var a = document.createElement("a");
	var XHR_URL = "/delay?delay=1000&file=build/boomerang-latest-debug.js";
	a.href = XHR_URL;
	XHR_URL = a.href;

	it("Should get 2 beacons: 1 onload, 1 xhr (XMLHttpRequest !== null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 2);
			});
	});

	it("Should have the second beacon contain the URL of the second XHR", function() {
		assert.include(tf.beacons[1].u, "boomerang-latest-debug.js");
	});

	it("Should have the second beacon contain t_done of at least one second", function() {
		assert.operator(tf.beacons[1].t_done, ">=", 1000, "t_done is at least 1 second");
	});

	it("Should have the second beacon contain t_resp of exactly the ResourceTiming time (if ResourceTiming is enabled)", function() {
		var xhr = BOOMR.getResourceTiming(XHR_URL);

		if (xhr) {
			assert.equal(tf.beacons[1].t_resp, Math.round(xhr.duration));
		}
	});

	it("Should have the second beacon contain t_resp of at least one second (if ResourceTiming not enabled)", function() {
		if (!BOOMR.getResourceTiming(XHR_URL)) {
			assert.operator(tf.beacons[1].t_resp, ">=", 1000, "t_resp is at least 1 second");
		}
	});

	it("Should have the second beacon contain t_page at least 1 second (if ResourceTiming is enabled)", function() {
		if (BOOMR.getResourceTiming(XHR_URL)) {
			assert.operator(tf.beacons[1].t_page, ">=", 1000, "t_page is above 1000 ms");
		}
	});

	it("Should have the second beacon contain t_resp + t_page ~= t_done", function() {
		assert.closeTo(tf.beacons[1].t_done, tf.beacons[1].t_page + tf.beacons[1].t_resp, 2);
	});

	it("Should get 1 beacons: 1 onload, 0 xhr (XMLHttpRequest === null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			undefined,
			function() {
				t.ensureBeaconCount(done, 1);
			});
	});

});
