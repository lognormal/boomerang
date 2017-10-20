/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,describe,it,assert*/

describe("e2e/04-page-params/31-page-params-page-group-xhr-only-match-multi", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent 3 beacons", function(done) {
		var _this = this;
		t.ifAutoXHR(
			done,
			function() {
				_this.timeout(5000);
				t.ensureBeaconCount(done, 4);
			});
	});

	it("Should send XHR with xhr.pg as XHR Test Page", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[1];
				assert.include(b["xhr.pg"], "XHR Test Page");
				done();
			});
	});

	it("Should send XHR with xhr.pg as XHR Test Page 2", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[2];
				assert.include(b["xhr.pg"], "XHR Test Page 2");
				done();
			});
	});

	it("Should send XHR with xhr.pg as XHR Do Not Ignore", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[3];
				assert.include(b["xhr.pg"], "XHR Test Do Not Ignore");
				done();
			});
	});

});

