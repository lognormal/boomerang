/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/07-autoxhr/02-onclick", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should have sent at least 2 beacons, 1x onload, 1x xhr", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 2);
				done();
			});
	});

	it("Should get 2 beacons: 1st onload 2nd image fetch", function(done){
		t.ifAutoXHR(
			done,
			function() {
				assert.include(tf.beacons[0].u, "02-onclick.html");
				done();
			});
	});

	it("Should have a second beacon with the image URL in it", function(done){
		t.ifAutoXHR(
			done,
			function() {
				assert.include(tf.beacons[1].u, "img.jpg");
				done();
			});
	});
});
