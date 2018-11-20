/*eslint-env mocha*/
/*global BOOMR_test,assert,it,describe*/

describe("e2e/04-page-params/16-page-params-xhr-all", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent 7 beacons (if XHR and Fetch API is supported)", function(done) {
		if (!t.isFetchApiSupported()) {
			return this.skip();
		}
		var _this = this;
		t.ifAutoXHR(
			done,
			function() {
				_this.timeout(5000);
				t.ensureBeaconCount(done, 7);
			},
			this.skip.bind(this));
	});

	it("Should have sent 4 beacons (if XHR is supported but Fetch API is not supported)", function(done) {
		if (t.isFetchApiSupported()) {
			return this.skip();
		}
		var _this = this;
		t.ifAutoXHR(
			done,
			function() {
				_this.timeout(5000);
				t.ensureBeaconCount(done, 4);
			},
			this.skip.bind(this));
	});

	it("Should set the Page Group of the first beacon 'Test Page'", function() {
		var b = tf.beacons[0];
		assert.equal(b["h.pg"], "Test Page");
	});

	it("Should set the XHR Page Group of the second beacon 'XHR Test Page 1'", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[1];
				assert.equal(b["xhr.pg"], "XHR Test Page 1");
				done();
			},
			this.skip.bind(this));
	});

	it("Should set the XHR Page Group of the second beacon 'XHR Test Page 2'", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[2];
				assert.equal(b["xhr.pg"], "XHR Test Page 2");
				done();
			},
			this.skip.bind(this));
	});

	it("Should not set the XHR Page Group of the third beacon", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[3];
				assert.isUndefined(b["xhr.pg"]);
				done();
			},
			this.skip.bind(this));
	});

	it("Should set the XHR Page Group of the fourth beacon 'XHR Test Page 1' (if Fetch API is supported)", function(done) {
		if (!t.isFetchApiSupported()) {
			return this.skip();
		}
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[4];
				assert.equal(b["xhr.pg"], "XHR Test Page 1");
				done();
			},
			this.skip.bind(this));
	});

	it("Should set the XHR Page Group of the fifth beacon 'XHR Test Page 2' (if Fetch API is supported)", function(done) {
		if (!t.isFetchApiSupported()) {
			return this.skip();
		}
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[5];
				assert.equal(b["xhr.pg"], "XHR Test Page 2");
				done();
			},
			this.skip.bind(this));
	});

	it("Should not set the XHR Page Group of the sixth beacon (if Fetch API is supported)", function(done) {
		if (!t.isFetchApiSupported()) {
			return this.skip();
		}
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[6];
				assert.isUndefined(b["xhr.pg"]);
				done();
			},
			this.skip.bind(this));
	});
});

