/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/39-page-group-fetch", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent 13 beacons", function(done) {
		if (!t.isFetchApiSupported()) {
			return this.skip();
		}
		var _this = this;
		t.ifAutoXHR(
			done,
			function() {
				_this.timeout(30000);
				t.ensureBeaconCount(done, 13);
			},
			this.skip.bind(this));
	});

	describe("Beacon 1 (onload)", function() {
		it("Should set the Page Group of the first beacon 'Test Pages'", function() {
			var b = tf.beacons[0];
			assert.equal(b["h.pg"], "Test Pages");
		});

		it("Should reset the Session Length on the first beacon", function() {
			var b = tf.beacons[0];
			assert.equal(b["rt.sl"], "1");
		});
	});

	describe("Beacon 2 (xhr) (if Fetch API is supported)", function() {
		it("Should set the Page Group of the second beacon 'XHR subresource'", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[1];
					assert.equal(b["xhr.pg"], "XHR subresource");
					done();
				},
				this.skip.bind(this));
		});

		it("Should not increase the Session Length on the second beacon", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
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

	describe("Beacon 3 (xhr) (if Fetch API is supported)", function() {
		it("Should set the Page Group of the third beacon 'XHR not subresource'", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[2];
					assert.equal(b["xhr.pg"], "XHR not subresource");
					done();
				},
				this.skip.bind(this));
		});

		it("Should increase the Session Length on the third beacon", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
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
		it("Should not set a Page Group on the fourth beacon", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[3];
					assert.equal(b["xhr.pg"], undefined);
					done();
				},
				this.skip.bind(this));
		});

		it("Should increase the Session Length on the fourth beacon", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[3];
					assert.equal(b["rt.sl"], "3");
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 5 (xhr) (if Fetch API is supported)", function() {
		it("Should set the Page Group of the fifth beacon 'XHR'", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[4];
					assert.equal(b["xhr.pg"], "XHR");
					done();
				},
				this.skip.bind(this));
		});

		it("Should not increase the Session Length on the fifth beacon", function(done) {
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

	describe("Beacon 6 (xhr) (if Fetch API is supported)", function() {
		it("Should have a sixth beacon matching QuerySelector based payload validation", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[5];
					assert.equal(b["xhr.pg"], "PageGroupQuerySelector");
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 7 (xhr) (if Fetch API is supported)", function() {
		it("Should have a seventh beacon matching XPath based payload validation", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			if (!Function.prototype.bind) {
				return this.skip();
			}

			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[6];
					var pg = b["xhr.pg"];

					if (pg === "Test Pages" && t.isIE()) {
						// IE 6-11 doesn't have a proper XPath parser
						this.skip();
						return done();
					}

					assert.equal(pg, "PageGroupXPath");
					done();
				}.bind(this),
				this.skip.bind(this));
		});
	});

	describe("Beacon 8 (xhr) (if Fetch API is supported)", function() {
		it("Should have a eigth beacon matching JSON based payload validation", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[7];
					assert.equal(b["xhr.pg"], "PageGroupJson");
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 9 (xhr) (if Fetch API is supported)", function() {
		it("Should have a ninth beacon matching text based payload validation", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[8];
					assert.equal(b["xhr.pg"], "PageGroupText");
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 10 (xhr) (if Fetch API is supported)", function() {
		it("Should have a tenth beacon matching onSendXHRPageGroup function based validation", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[9];
					assert.equal(b["xhr.pg"], "XHRPageGroupSendPayload");
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 11 (xhr) (if Fetch API is supported)", function() {
		it("Should have an eleventh beacon matching onSendXHRPageGroup function based validation with POST data", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[10];
					assert.equal(b["xhr.pg"], "PageXHRPOST");
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 12 (xhr) (if Fetch API is supported)", function() {
		it("Should set the Page Group of the twelth beacon 'Support Pages'", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[11];
					assert.equal(b["xhr.pg"], "Support Pages");
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 13 (xhr) (if Fetch API is supported)", function() {
		it("Should set the Page Group of the thirteenth beacon 'Support Pages'", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[12];
					assert.equal(b["xhr.pg"], "Support Pages");
					done();
				},
				this.skip.bind(this));
		});
	});
});
