/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/04-xhr-use-rt", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	var a = document.createElement("a");

	it("Should get 2 beacons: 1 onload, 2 xhr (XMLHttpRequest !== null and Fetch API is supported)", function(done) {
		if (!t.isFetchApiSupported()) {
			return this.skip();
		}
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 3);
			},
			this.skip.bind(this));
	});

	it("Should get 2 beacons: 1 onload, 1 xhr (XMLHttpRequest !== null and Fetch API is not supported)", function(done) {
		if (t.isFetchApiSupported()) {
			return this.skip();
		}
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 2);
			},
			this.skip.bind(this));
	});

	it("Should get 1 beacon: 1 onload, 0 xhr (XMLHttpRequest === null)", function(done) {
		if (t.isFetchApiSupported()) {
			return this.skip();
		}
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			this.skip.bind(this),
			function() {
				t.ensureBeaconCount(done, 1);
			});
	});

	describe("Beacon 1 (onload)", function() {
		var i = 0;
		it("Should be an onload beacon", function() {
			if (t.isNavigationTimingSupported()) {
				assert.equal(tf.beacons[i]["rt.start"], "navigation");
			}
			else {
				assert.equal(tf.beacons[i]["rt.start"], "none");
			}
		});
	});

	describe("Beacon 2 (xhr)", function() {
		var i = 1;
		it("Should have the beacon contain the URL of the XHR", function() {
			assert.include(tf.beacons[i].u, "&id=xhr");
		});

		it("Should have the beacon contain t_done of at least 3 seconds", function() {
			assert.operator(tf.beacons[i].t_done, ">=", 3000, "t_done is at least 1 second");
		});

		it("Should have the beacon contain t_resp of exactly the ResourceTiming time (if ResourceTiming is enabled)", function() {
			if (t.isResourceTimingSupported()) {
				a.href = window.XHR_URL;
				var url = a.href;
				var entry = t.findFirstResource(url);
				if (entry) {
					assert.closeTo(tf.beacons[i].t_resp, entry.duration, 2);
				}
				else {
					this.skip();
				}
			}
			else {
				this.skip();
			}
		});

		it("Should have the beacon contain t_resp of at least 3 seconds (if ResourceTiming not enabled)", function() {
			if (!t.isResourceTimingSupported()) {
				assert.operator(tf.beacons[i].t_resp, ">=", 3000, "t_resp is at least 3 second");
			}
			else {
				this.skip();
			}
		});

		it("Should have the beacon contain t_page of at least 0 ms (if ResourceTiming is enabled)", function() {
			if (t.isResourceTimingSupported()) {
				assert.operator(tf.beacons[i].t_page, ">=", 0, "t_page is not negative");

				if (tf.beacons[i].t_page >= 1000) {
					// Some Chrome and IE versions incorrectly report RT if the page is busy
					// See: https://bugs.chromium.org/p/chromium/issues/detail?id=824155
					this.skip();
				}
			}
			else {
				this.skip();
			}
		});

		it("Should have the second beacon contain t_resp + t_page ~= t_done", function() {
			assert.closeTo(tf.beacons[i].t_done, tf.beacons[i].t_page + tf.beacons[i].t_resp, 2);
		});
	});

	describe("Beacon 3 (xhr) (if Fetch API is supported)", function() {
		var i = 2;
		it("Should have the beacon contain the URL of the fetch", function() {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			assert.include(tf.beacons[i].u, "&id=fetch");
		});

		it("Should have the beacon contain t_done of at least 3 seconds", function() {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			assert.operator(tf.beacons[i].t_done, ">=", 3000, "t_done is at least 3 seconds");
		});

		it("Should have the beacon contain t_resp of exactly the ResourceTiming time (if ResourceTiming is enabled)", function() {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			if (t.isResourceTimingSupported()) {
				a.href = window.FETCH_URL;
				var url = a.href;
				var entry = t.findFirstResource(url);
				if (entry) {
					assert.closeTo(tf.beacons[i].t_resp, entry.duration, 2);
				}
				else {
					this.skip();
				}
			}
			else {
				this.skip();
			}
		});

		it("Should have the beacon contain t_resp near 3 seconds (if ResourceTiming not enabled)", function() {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			if (!t.isResourceTimingSupported()) {
				assert.closeTo(tf.beacons[i].t_resp, 3000, 250);
			}
			else {
				this.skip();
			}
		});

		it("Should have the beacon contain t_page of at least 1000 ms (if ResourceTiming is enabled)", function() {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			if (t.isResourceTimingSupported()) {
				// 3s in Chrome 67, 1s in other browsers
				assert.operator(tf.beacons[i].t_page, ">=", 1000, "t_page is at least 1s");
			}
			else {
				this.skip();
			}
		});

		it("Should have the second beacon contain t_resp + t_page ~= t_done", function() {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			if (t.isResourceTimingSupported()) {
				// unlike XHR, we don't get readystate events and can't fake timings if RT is not avail
				assert.closeTo(tf.beacons[i].t_done, tf.beacons[i].t_page + tf.beacons[i].t_resp, 2);
			}
			else {
				this.skip();
			}
		});
	});
});
