/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/07-autoxhr/02-onclick", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;
	it("Should have sent at least 2 beacons, 1x onload, 1x xhr", function(done) {
		if (window.MutationObserver && typeof window.MutationObserver === "function") {

			t.ifAutoXHR(
				done,
				function() {
					assert.lengthOf(tf.beacons, 2);
					done();
				}
			);
		}
		else {
			assert.lengthOf(tf.beacons, 1);
			done();
		}
	});

	it("Should get 2 beacons: 1st onload 2nd image fetch", function(done){
		if (window.MutationObserver && typeof window.MutationObserver === "function") {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[0].u, "02-onclick.html");
					done();
				});
		}
		else {
			done();
		}
	});

	it("Should have a second beacon with the image URL in it", function(done){
		if (window.MutationObserver && typeof window.MutationObserver === "function") {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[1].u, "img.jpg");
					done();
				});
		}
		else {
			done();
		}
	});
});
