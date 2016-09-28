/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/04-page-params/02-page-group-xhrs", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent five beacons", function(done) {
		var _this = this;
		t.ifAutoXHR(
			done,
			function() {
				_this.timeout(10000);
				t.ensureBeaconCount(done,  5);
			});
	});

	it("Should set the Page Group of the first beacon 'Test Pages'", function() {
		var b = tf.beacons[0];
		assert.equal(b["h.pg"], "Test Pages");
	});

	it("Should reset the Session Length on the first beacon", function() {
		var b = tf.beacons[0];
		assert.equal(b["rt.sl"], "1");
	});

	it("Should set the Page Group of the second beacon 'XHR subresource'", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[1];
				assert.equal(b["xhr.pg"], "XHR subresource");
				done();
			});
	});

	it("Should not increase the Session Length on the second beacon", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[1];
				assert.equal(b["rt.sl"], "1");
				done();
			});
	});

	it("Should set the Page Group of the third beacon 'XHR not subresource'", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[2];
				assert.equal(b["xhr.pg"], "XHR not subresource");
				done();
			});
	});

	it("Should increase the Session Length on the third beacon", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[2];
				assert.equal(b["rt.sl"], "2");
				done();
			});
	});

	it("Should not set a Page Group on the fourth beacon", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[3];
				assert.equal(b["xhr.pg"], undefined);
				done();
			});
	});

	it("Should increase the Session Length on the fourth beacon", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[3];
				assert.equal(b["rt.sl"], "3");
				done();
			});
	});

	it("Should set the Page Group of the fifth beacon 'XHR'", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[4];
				assert.equal(b["xhr.pg"], "XHR");
				done();
			});
	});

	it("Should not increase the Session Length on the fifth beacon", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				var b = tf.beacons[4];
				assert.equal(b["rt.sl"], "3");
				done();
			});
	});
});
