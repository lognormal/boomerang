/*eslint-env mocha*/
/*global BOOMR_test,assert,it,describe*/

describe("e2e/04-page-params/19-xhrs-as-subresources", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent 1 beacon", function(done) {
		var _this = this;
		t.ifAutoXHR(
			done,
			function() {
				_this.timeout(5000);
				t.ensureBeaconCount(done, 3);
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

