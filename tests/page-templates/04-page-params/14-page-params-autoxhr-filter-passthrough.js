/*eslint-env mocha*/
/*global BOOMR_test,assert,it,describe*/

describe("e2e/04-page-params/14-page-params-autoxhr-filter-passthrough", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent 3 beacons (if XHR and Fetch API is supported)", function(done) {
		if (!t.isFetchApiSupported()) {
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

	it("Should have sent 2 beacons (if XHR is supported but Fetch API is not supported)", function(done) {
		if (t.isFetchApiSupported()) {
			return this.skip();
		}
		var _this = this;
		t.ifAutoXHR(
			done,
			function() {
				_this.timeout(5000);
				t.ensureBeaconCount(done, 2);
			},
			this.skip.bind(this));
	});

	describe("Beacon 1 (onload)", function() {
		it("Should set the Page Group of the first beacon 'Test Page'", function() {
			var b = tf.beacons[0];
			assert.equal(b["h.pg"], "Test Page");
		});
	});

	describe("Beacon 2 (xhr)", function() {
		it("Should set the XHR Page Group of the second beacon 'XHR Test Page'", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[1];
					assert.equal(b["xhr.pg"], "XHR Test Page");
					done();
				},
				this.skip.bind(this));
		});
	});

	describe("Beacon 3 (xhr) (if Fetch API is supported)", function() {
		it("Should set the XHR Page Group of the third beacon 'XHR Test Page'", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					var b = tf.beacons[2];
					assert.equal(b["xhr.pg"], "XHR Test Page");
					done();
				},
				this.skip.bind(this));
		});
	});
});
