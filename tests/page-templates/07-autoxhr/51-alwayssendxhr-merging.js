/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/51-alwayssendxhr-merging", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	var pathName = window.location.pathname;

	it("Should get 3 beacons: 1 onload, 2 xhr (XMLHttpRequest !== null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 3);
			},
			this.skip.bind(this));
	});

	it("Should get 1 beacons: 1 onload (XMLHttpRequest === null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			this.skip.bind(this),
			function() {
				t.ensureBeaconCount(done, 1);
			});
	});

	describe("Beacon 1 (page load)", function() {
		var i = 0;

		it("Should be a page load", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.isUndefined(tf.beacons[i]["http.initiator"]);
					done();
				},
				this.skip.bind(this));
		});

		it("Should have u of " + pathName, function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, pathName);
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 2 (real XHR)", function() {
		var i = 1;

		it("Should have the second beacon be an XHR", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.initiator"], "xhr");
					done();
				},
				this.skip.bind(this));
		});

		it("Should have u of /assets/img.jpg", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "img.jpg");
					done();
				},
				this.skip.bind(this));
		});

		it("Should have pgu of " + pathName, function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].pgu, pathName);
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 3 (fake XHR)", function() {
		var i = 2;

		it("Should be an XHR", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.initiator"], "xhr");
					done();
				},
				this.skip.bind(this));
		});

		it("Should have u of http://bad.com", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "http://bad.com");
					done();
				},
				this.skip.bind(this));
		});

		it("Should have pgu of " + pathName, function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].pgu, pathName);
					done();
				},
				this.skip.bind(this));
		});
	});
});
