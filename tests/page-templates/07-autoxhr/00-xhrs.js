/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/00-xhrs", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 13 beacons: 1 onload, 12 xhr (XMLHttpRequest is supported)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 13);
			},
			this.skip.bind(this)
		);
	});

	it("Should get 1 beacons: 1 onload, 0 xhr (XMLHttpRequest is not supported)", function(done) {
		t.ifAutoXHR(
			done,
			this.skip.bind(this),
			function() {
				t.ensureBeaconCount(done, 1);
			});
	});

	it("Should have all XHR beacons set rt.nstart = navigationTiming (if NavigationTiming is supported)", function(done) {
		var that = this;
		t.ifAutoXHR(
			done,
			function() {
				if (typeof BOOMR.plugins.RT.navigationStart() !== "undefined") {
					for (var i = 1; i <= 9; i++) {
						assert.equal(tf.beacons[i]["rt.nstart"], BOOMR.plugins.RT.navigationStart());
					}
					done();
				}
				else {
					that.skip();
				}
			},
			this.skip.bind(this)
		);
	});

	describe("Beacon 1 (onload)", function() {
		it("Should have correct url", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[0].u, "00-xhrs.html");
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 2 (xhr) for 200 async XHR (XMLHttpRequest is supported)", function() {
		var i = 1;
		it("Should have correct url", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "script200.js");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should not contain status", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.isUndefined(tf.beacons[i]["http.errno"]);
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 3 (xhr) for 200 sync (XMLHttpRequest is supported)", function() {
		var i = 2;
		it("Should have correct url", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "script200.js");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should not contain status (XMLHttpRequest is supported)", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.isUndefined(tf.beacons[i]["http.errno"]);
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 4 (xhr) for 404 async XHR (XMLHttpRequest is supported)", function() {
		var i = 3;
		it("Should have correct url", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "/404");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain 404 status", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.errno"], "404");
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 5 (xhr) for 404 sync XHR (XMLHttpRequest is supported)", function() {
		var i = 4;
		it("Should have correct url", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "/404");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain 404 status", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.errno"], "404");
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 6 (xhr) for X-O XHR (XMLHttpRequest is supported)", function() {
		var i = 5;
		it("Should have correct url", function(done) {
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

	describe("Beacon 7 (xhr) for Aborted XHR (XMLHttpRequest is supported)", function() {
		var i = 6;
		it("Should have correct url", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "script200.js");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain XHR_STATUS_ABORT status", function(done) {
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

	describe("Beacon 8 (xhr) for timedout XHR (XMLHttpRequest is supported)", function() {
		var i = 7;
		it("Should have correct url", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "script200.js");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain XHR_STATUS_TIMEOUT status", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.errno"], "-1001");
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 9 (xhr) for POST XHR (XMLHttpRequest is supported)", function() {
		var i = 8;
		it("Should have correct url", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "/blackhole");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should not contain status", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.isUndefined(tf.beacons[i]["http.errno"]);
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain POST method", function(done) {
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

	describe("Beacon 10 (xhr) for timedout POST XHR (XMLHttpRequest is supported)", function() {
		var i = 9;
		it("Should have correct url", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "/blackhole");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain XHR_STATUS_TIMEOUT status", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.errno"], "-1001");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain POST method", function(done) {
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

	describe("Beacon 11 (xhr) for server dropped connection XHR (XMLHttpRequest is supported)", function() {
		var i = 10;
		it("Should have correct url", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "/drop");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain XHR_STATUS_ERROR status", function(done) {
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


	describe("Beacon 12 (xhr) for 500 async XHR (XMLHttpRequest is supported)", function() {
		var i = 11;
		it("Should have correct url", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "/500");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should contain 500 status", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.errno"], "500");
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 13 (xhr) for 200 chunked async XHR (XMLHttpRequest is supported)", function() {
		var i = 12;
		it("Should have correct url", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "/chunked");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should not contain status", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.isUndefined(tf.beacons[i]["http.errno"]);
					done();
				},
				this.skip.bind(this)
			);
		});
	});
});
