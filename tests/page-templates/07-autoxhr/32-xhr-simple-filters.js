/*eslint-env mocha*/
/*global assert,it,describe*/

describe("e2e/07-autoxhr/32-xhr-simple-filters", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 2 beacons: 1 onload, 1 xhr (XMLHttpRequest !== null)", function(done) {
		this.timeout(3000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 2);
			});
	});

	it("Should have the second beacon contain the URL of the second XHR", function(done) {
		this.timeout(5000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(function() {
					assert.include(tf.beacons[1].u, "script200.js");
					done();
				}, 2);
			});
	});
});
