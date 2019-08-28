/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,describe,it,assert*/

describe("e2e/07-autoxhr/42-fetch-api", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent 17 beacons (if Fetch API is supported)", function(done) {
		this.timeout(10000);
		if (!t.isFetchApiSupported()) {
			return this.skip();
		}
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 17);
			},
			function() {
				t.ensureBeaconCount(done, 1);
			}
		);
	});

	it("Should have sent 1 beacon (if Fetch API is not supported)", function(done) {
		this.timeout(10000);
		if (t.isFetchApiSupported()) {
			return this.skip();
		}
		t.ensureBeaconCount(done, 1);
	});

	it("Should have http.type = f on all XHR beacons (if Fetch API is supported)", function() {
		if (!t.isFetchApiSupported()) {
			return this.skip();
		}
		for (var i = 1; i < tf.beacons.length; i++) {
			assert.equal(tf.beacons[i]["http.type"], "f");
		}
	});

	describe("Beacon 1 (onload)", function() {
		it("Should be an onload beacon", function() {
			assert.include(tf.beacons[0].u, "42-fetch-api.html");
			if (t.isNavigationTimingSupported()) {
				assert.equal(tf.beacons[0]["rt.start"], "navigation");
			}
			else {
				assert.equal(tf.beacons[0]["rt.start"], "none");
			}
		});
	});

	describe("Beacon 2 (xhr) for fetch with string url (if Fetch API is supported)", function() {
		it("Should contain 'script200.js'", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[1].u, "script200.js");
					assert.include(tf.beacons[1].u, "req=0");
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 3 (xhr) for fetch with Request object (if Fetch API is supported)", function() {
		it("Should contain 'script200.js'", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[2].u, "script200.js");
					assert.include(tf.beacons[2].u, "req=1");
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 4 (xhr) for chunked response fetch (if Fetch API and ReadableStream are supported)", function() {
		it("Should contain '/chunked'", function(done) {
			if (!t.isFetchApiSupported() || !window.ReadableStream) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[3].u, "/chunk");
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 5 (xhr) for 404 status fetch (if Fetch API is supported)", function() {
		it("Should contain '/404'", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[4].u, "/404");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain 404 status", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[4]["http.errno"], "404");
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 6 (xhr) for 500 status fetch (if Fetch API is supported)", function() {
		it("Should contain '/500'", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[5].u, "/500");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain 500 status", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[5]["http.errno"], "500");
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 7 (xhr) for server dropped connection fetch (if Fetch API is supported)", function() {
		it("Should contain '/drop'", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[6].u, "/drop");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain XHR_STATUS_ERROR status", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[6]["http.errno"], "-998");
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 8 (xhr) for POST fetch with string url and response body not used (if Fetch API is supported)", function() {
		var i = 7;
		it("Should contain '/chunked'", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "/chunked");
					assert.include(tf.beacons[i].u, "req=0");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should have http.method = POST", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.method"], "POST");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain fetch.bnu=1", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["fetch.bnu"], "1");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain t_page and t_resp (if ResourceTiming is supported)", function(done) {
			// response should have been fast enough for us to capture the RT entry
			if (!t.isFetchApiSupported() || !t.isResourceTimingSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.isDefined(tf.beacons[i].t_page);
					assert.isDefined(tf.beacons[i].t_resp);
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 9 (xhr) for POST fetch with Request object and response body not used (if Fetch API is supported)", function() {
		var i = 8;
		it("Should contain '/chunked'", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "/chunked");
					assert.include(tf.beacons[i].u, "req=1");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should have http.method = POST", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.method"], "POST");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain fetch.bnu=1", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["fetch.bnu"], "1");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should not contain t_page and t_resp (if ResourceTiming is supported)", function(done) {
			// response should have been received too late for us to capture the RT entry
			if (!t.isFetchApiSupported() || !t.isResourceTimingSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.isUndefined(tf.beacons[i].t_page);
					assert.isUndefined(tf.beacons[i].t_resp);
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 10 (xhr) for POST fetch with Request object and init override (if Fetch API is supported)", function() {
		var i = 9;
		it("Should contain '/blackhole'", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "/blackhole");
					assert.include(tf.beacons[i].u, "req=1");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should have http.method = POST", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.method"], "POST");
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 11 (xhr) for aborted fetch (if Fetch API is supported)", function() {
		var i = 10;
		it("Should contain '/delay'", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "/delay");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain XHR_STATUS_ABORT status (if AbortController is supported)", function(done) {
			if (!t.isFetchApiSupported() || !window.AbortController) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.errno"], "-999");
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 12 (xhr) for X-O fetch with same-origin policy (if Fetch API is supported)", function() {
		var i = 11;
		it("Should contain correct url", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, window.xoUrl);
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain XHR_STATUS_ERROR status", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.errno"], "-998");
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 13 (xhr) for fetch read with `text` (if Fetch API is supported)", function() {
		var i = 12;
		it("Should contain correct url", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "req=text");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should have read the correct data", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(window.results.text.length, 18);
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 14 (xhr) for fetch read with `json` (if Fetch API is supported)", function() {
		var i = 13;
		it("Should contain correct url", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "req=json");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should have read the correct data", function(done) {
			if (!t.isFetchApiSupported() || !window.JSON) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(window.results.json.data, 1);
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 15 (xhr) for fetch read with `blob` (if Fetch API is supported)", function() {
		var i = 14;
		it("Should contain correct url", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "req=blob");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should have read the correct data", function(done) {
			if (!t.isFetchApiSupported() || !window.JSON) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(window.results.blob.size, 18);
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 16 (xhr) for fetch read with `arrayBuffer` (if Fetch API is supported)", function() {
		var i = 15;
		it("Should contain correct url", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "req=arrayBuffer");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should have read the correct data", function(done) {
			if (!t.isFetchApiSupported() || !window.JSON) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(window.results.arrayBuffer.byteLength, 18);
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 17 (xhr) for fetch read with `formData` (if Fetch API is supported)", function() {
		var i = 16;
		it("Should contain correct url", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "req=formData");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should have read the correct data", function(done) {
			if (!t.isFetchApiSupported() || !window.JSON) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(window.results.formData.byteLength, 18);
					done();
				},
				this.skip.bind(this)
			);
		});
	});
});

