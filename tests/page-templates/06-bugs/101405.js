/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/101405", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should get 3 beacons: 1 onload, 2 xhr (XMLHttpRequest !== null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 3);
			});
	});

	it("Should have the first beacon be a Page Load beacon", function(done) {
		t.ifAutoXHR(done, function() {
			assert.isUndefined(tf.beacons[0]["http.initiator"]);
			done();
		});
	});

	it("Should have the second beacon be an XHR", function(done) {
		t.ifAutoXHR(done, function() {
			assert.equal(tf.beacons[1]["http.initiator"], "xhr");
			done();
		});
	});

	it("Should have the second beacon have http.errno = 404", function(done) {
		t.ifAutoXHR(done, function() {
			assert.equal(tf.beacons[1]["http.errno"], "404");
			done();
		});
	});

	it("Should have the third beacon be an XHR", function(done) {
		t.ifAutoXHR(done, function() {
			assert.equal(tf.beacons[2]["http.initiator"], "xhr");
			done();
		});
	});

	it("Should have the third beacon have http.errno null", function(done) {
		t.ifAutoXHR(done, function() {
			assert.isUndefined(tf.beacons[2]["http.errno"]);
			done();
		});
	});

	it("Should have called the page-instrumented XHR", function(done) {
		t.ifAutoXHR(done, function() {
			assert.equal(XMLHttpRequest.prototype.oldOpenCalled, true);
			done();
		});
	});
});
