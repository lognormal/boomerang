/*eslint-env mocha*/
/*global BOOMR_test,assert,it,describe*/

describe("e2e/04-page-params/14-page-params-autoxhr-filter-passthrough", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent 2 beacons", function(done) {
		var _this = this;
		t.ifAutoXHR(
			done,
			function() {
				_this.timeout(3000);
				t.ensureBeaconCount(done, 2);
			},
			this.skip.bind(this));
	});

	it("Should set the Page Group of the first beacon 'Test Page'", function() {
		var b = tf.beacons[0];
		assert.equal(b["h.pg"], "Test Page");
	});

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
