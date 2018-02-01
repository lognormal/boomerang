/*eslint-env mocha*/
/*global BOOMR_test,assert,it,describe*/

describe("e2e/04-page-params/17-page-params-xhr-ignore", function() {
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
				_this.timeout(5000);
				t.ensureBeaconCount(done, 2);
			},
			this.skip.bind(this));
	});

	it("Should set the Page Group of the first beacon 'Test Page'", function() {
		var b = tf.beacons[0];
		assert.equal(b["h.pg"], "Test Page");
	});

	it("Should send the second XHR which didn't match the ignore match", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[1];
				assert.include(b.u, "?id=2");
				assert.isUndefined(b["h.pg"]);
				assert.isUndefined(b["xhr.pg"]);
				done();
			},
			this.skip.bind(this));
	});
});


