/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/29-xhrs-in-succession", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 5 beacons: 1 onload, 4 xhr (XMLHttpRequest !== null)", function(done) {
		this.timeout(5000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 5);
			},
			this.skip.bind(this));
	});

	describe("Beacon 2 (xhr)", function() {
		var i = 1;
		it("Should have a time of around 0s", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.closeTo(tf.beacons[i].t_done, 0, 100);
					done();
				},
				this.skip.bind(this));
		});

		it("Should have the URL of the third XHR (aborted)", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "id=xhr3");
					done();
				},
				this.skip.bind(this));
		});

		it("Should have an error status (aborted)", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.errno"], "-999");
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 3 (xhr)", function() {
		var i = 2;
		it("Should have a time of around 0s", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.closeTo(tf.beacons[i].t_done, 0, 100);
					done();
				},
				this.skip.bind(this));
		});

		it("Should have the URL of the fourth XHR (aborted)", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "id=xhr4");
					done();
				},
				this.skip.bind(this));
		});

		it("Should have an error status (aborted)", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.equal(tf.beacons[i]["http.errno"], "-999");
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 4 (xhr)", function() {
		var i = 3;
		it("Should have a time of around 2s", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.closeTo(tf.beacons[i].t_done, 2000, 100);
					done();
				},
				this.skip.bind(this));
		});

		it("Should have the URL of the second XHR", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "id=xhr2");
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 5 (xhr)", function() {
		var i = 4;
		it("Should have a time of around 3s", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.closeTo(tf.beacons[i].t_done, 3000, 100);
					done();
				},
				this.skip.bind(this));
		});

		it("Should have a t_resp time of around 2s", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.closeTo(tf.beacons[i].t_resp, 2000, 100);
					done();
				},
				this.skip.bind(this));
		});

		it("Should have the URL of the first XHR", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "id=xhr1");
					done();
				},
				this.skip.bind(this));
		});
	});
});
