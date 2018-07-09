/*eslint-env mocha*/
/*global BOOMR_test,assert,it,describe*/

describe("e2e/04-page-params/19-xhrs-as-subresources", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent 5 beacons (if XHR and Fetch API is supported)", function(done) {
		if (!t.isFetchApiSupported()) {
			return this.skip();
		}
		var _this = this;
		t.ifAutoXHR(
			done,
			function() {
				_this.timeout(5000);
				t.ensureBeaconCount(done, 5);
			},
			this.skip.bind(this));
	});

	it("Should have sent 3 beacons (if XHR is supported by Fetch API is not supported)", function(done) {
		if (t.isFetchApiSupported()) {
			return this.skip();
		}
		var _this = this;
		t.ifAutoXHR(
			done,
			function() {
				_this.timeout(5000);
				t.ensureBeaconCount(done, 3);
			},
			this.skip.bind(this));
	});

	it("Should have session length = 1 on first beacon", function() {
		var b = tf.beacons[0];
		assert.equal(b["rt.sl"], "1");
	});

	describe("Beacon 2 (xhr)", function() {
		it("Should have id=1 as part of the second beacon URL", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[1];
					assert.include(b.u, "id=1");
					done();
				},
				this.skip.bind(this));
		});

		it("Should not increase session length on second beacon", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[1];
					assert.equal(b["rt.sl"], "1");
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 3 (xhr)", function() {
		it("Should have id=2 as part of the third beacon URL", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[2];
					assert.include(b.u, "id=2");
					done();
				},
				this.skip.bind(this));
		});

		it("Should increase session length on third beacon", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[2];
					assert.equal(b["rt.sl"], "2");
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 4 (xhr) (if Fetch API is supported)", function() {
		it("Should have id=1 as part of the fourth beacon URL", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[3];
					assert.include(b.u, "id=1");
					done();
				},
				this.skip.bind(this));
		});

		it("Should not increase session length on fourth beacon", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[3];
					assert.equal(b["rt.sl"], "2");
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 5 (xhr) (if Fetch API is supported)", function() {
		it("Should have id=2 as part of the fifth beacon URL", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[4];
					assert.include(b.u, "id=2");
					done();
				},
				this.skip.bind(this));
		});

		it("Should increase session length on fifth beacon", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[4];
					assert.equal(b["rt.sl"], "3");
					done();
				},
				this.skip.bind(this));
		});
	});
});

