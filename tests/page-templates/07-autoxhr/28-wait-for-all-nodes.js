/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/07-autoxhr/28-wait-for-all-nodes", function() {
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
			// Will still send 2 beacons but the second one will only contain the XHR timing not MO...
			assert.lengthOf(tf.beacons, 2);
			done();
		}
	});

	it("Should have a t_done of at least 1s based on the duration of the image being fetched", function(done) {
		if (window.MutationObserver && typeof window.MutationObserver === "function") {
			t.ifAutoXHR(
				done,
				function() {
					assert.closeTo(tf.beacons[1].t_done, 1000, 300, "t_done was not close to 1000ms (duration of image request)");
					done();
				}
			);
		}
		else {
			assert.closeTo(tf.beacons[1].t_done, 100, 50, "t_done is not close to 100ms (duration of the XHR request)");
			done();
		}
	});
});
