/*eslint-env mocha*/
/*global BOOMR_test,assert,it,describe*/

describe("e2e/04-page-params/15-page-params-xhr-none", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should set the Page Group of the first beacon 'Test Page'", function() {
		var b = tf.beacons[0];
		assert.equal(b["h.pg"], "Test Page");
	});

	it("Should have sent 1 beacon", function(done) {
		var _this = this;
		t.ifAutoXHR(
			done,
			function() {
				_this.timeout(3000);
				t.ensureBeaconCount(done, 1);
			},
			this.skip.bind(this));
	});
});
