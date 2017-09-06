/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/39-uninteresting-mo-followed-by-interesting", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 2 beacons: 1 onload, 1 click (XMLHttpRequest !== null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 2);
			});
	});

	it("Should have the first beacon be a page load beacon (XMLHttpRequest !== null)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.include(tf.beacons[0].u, "39-uninteresting-mo-followed-by-interesting.html");
				done();
			});
	});

	it("Should have the second beacon be a XHR beacon (XMLHttpRequest !== null)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.equal(tf.beacons[1]["http.initiator"], "xhr");
				done();
			});
	});

	it("Should have the second beacon have the URL of the XHR (XMLHttpRequest !== null)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				assert.include(tf.beacons[1].u, "blank.html");
				done();
			});
	});
});
