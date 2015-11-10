/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/03-xhrs-overlapping", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 3 beacons: 1 onload, 2 xhr (XMLHttpRequest !== null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 3);
			});
	});

	it("Should have the second beacon contain the URL of the first XHR", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(function() {
					assert.include(tf.beacons[1].u, "?1");
					done();
				}, 3);
			});
	});

	it("Should have the second beacon contain a time of around around 3 seconds", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(function() {
					assert.closeTo(tf.beacons[1].t_done, 3000, 100);
					done();
				}, 3);
			});
	});

	it("Should have the third beacon contain the URL of the second XHR", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(function() {
					assert.include(tf.beacons[2].u, "?2");
					done();
				}, 3);
			});
	});

	it("Should have the third beacon contain a time of near 0 seconds", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(function() {
					assert.closeTo(tf.beacons[2].t_done, 0, 100);
					done();
				}, 3);
			});
	});

	it("Should get 1 beacons: 1 onload, 0 xhr (XMLHttpRequest === null)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			undefined,
			function() {
				t.ensureBeaconCount(done, 1);
			});
	});

});
