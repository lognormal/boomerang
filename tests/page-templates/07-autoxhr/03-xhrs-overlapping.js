/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/03-xhrs-overlapping", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 3 beacons: 1 onload, 2 xhr (XMLHttpRequest !== null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 3);
			},
			this.skip.bind(this));
	});

	describe("Beacon 2", function() {
		it("Should contain a time of close to 0ms when the XHR is aborted", function(done) {
			this.timeout(10000);
			t.ifAutoXHR(
				done,
				function() {
					assert.closeTo(tf.beacons[1].t_done, 0, 50);
					done();
				},
				this.skip.bind(this));
		});

		it("Should contain http.initiator = xhr", function(done) {
			this.timeout(10000);
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[1]["http.initiator"], "xhr");
					done();
				},
				this.skip.bind(this));
		});

		it("Should contain http.errno = -999", function(done) {
			this.timeout(10000);
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[1]["http.errno"], -999);
					done();
				},
				this.skip.bind(this));
		});

		it("Should contain pgu of the page", function(done) {
			this.timeout(10000);
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[1].pgu, document.location.href);
					done();
				},
				this.skip.bind(this));
		});

		it("Should contain u of the first XHR", function(done) {
			this.timeout(10000);
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[1].u, "boomerang-latest-debug.js?2");
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 3", function() {
		it("Should contain a time of around 3,000ms when the XHR is aborted", function(done) {
			this.timeout(10000);
			t.ifAutoXHR(
				done,
				function() {
					assert.closeTo(tf.beacons[2].t_done, 3000, 100);
					done();
				},
				this.skip.bind(this));
		});

		it("Should contain http.initiator = xhr", function(done) {
			this.timeout(10000);
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[2]["http.initiator"], "xhr");
					done();
				},
				this.skip.bind(this));
		});

		it("Should contain http.errno = -999", function(done) {
			this.timeout(10000);
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[2]["http.errno"], -999);
					done();
				},
				this.skip.bind(this));
		});

		it("Should contain pgu of the page", function(done) {
			this.timeout(10000);
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[2].pgu, document.location.href);
					done();
				},
				this.skip.bind(this));
		});

		it("Should contain u of the first XHR", function(done) {
			this.timeout(10000);
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[2].u, "boomerang-latest-debug.js?1");
					done();
				},
				this.skip.bind(this));
		});
	});

	it("Should get 1 beacons: 1 onload, 0 xhr (XMLHttpRequest === null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			this.skip.bind(this),
			function() {
				t.ensureBeaconCount(done, 1);
			});
	});

});
