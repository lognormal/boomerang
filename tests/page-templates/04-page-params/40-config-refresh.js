/*eslint-env mocha*/
/*global BOOMR_test,assert,it,describe*/

describe("e2e/04-page-params/40-config-refresh", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent 2 beacons (if XHR is supported)", function(done) {
		var _this = this;
		t.ifAutoXHR(
			done,
			function() {
				_this.timeout(5000);
				t.ensureBeaconCount(done, 2);
			},
			this.skip.bind(this));
	});

	it("Should have sent 1 beacon (if XHR is not supported)", function(done) {
		var _this = this;
		t.ifAutoXHR(
			done,
			this.skip.bind(this),
			function() {
				_this.timeout(5000);
				t.ensureBeaconCount(done, 1);
			});
	});

	it("Should set the Page Group of the first beacon 'Test Page'", function() {
		var b = tf.beacons[0];
		assert.isUndefined(b["xhr.pg"]);
		assert.equal(b["h.pg"], "Test Page");
	});

	it("Should set the XHR Page Group of the second beacon 'XHR Test Page 1'", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[1];
				assert.isUndefined(b["h.pg"]);
				assert.equal(b["xhr.pg"], "XHR Test Page 1");
				done();
			},
			this.skip.bind(this));
	});
});

