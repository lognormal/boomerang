/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/07-autoxhr/28-wait-for-all-nodes", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should have sent at least 2 beacons, 1x onload, 1x xhr", function(done) {
		if (t.isMutationObserverSupported()) {
			t.ifAutoXHR(
				done,
				function() {
					assert.lengthOf(tf.beacons, 2);
					done();
				},
				this.skip.bind(this)
			);
		}
		else {
			// Will still send 2 beacons but the second one will only contain the XHR timing not MO...
			t.ifAutoXHR(
				done,
				function() {
					assert.lengthOf(tf.beacons, 2);
					done();
				},
				this.skip.bind(this)
			);
		}
	});

	describe("Beacon 2", function() {
		var i = 1;
		it("Should have a t_done of at least 1600ms based on the duration of the XHR and images being fetched (if MutationObserver is supported)", function(done) {
			// 400ms (XHR) + 1000ms (IMG2) + 200 (IMG3)
			if (t.isMutationObserverSupported()) {
				t.ifAutoXHR(
					done,
					function() {
						assert.closeTo(tf.beacons[i].t_done, 1600, 300, "t_done was not close to 1600ms");
						done();
					},
					this.skip.bind(this)
				);
			}
			else {
				this.skip();
			}
		});

		it("Should have a t_done of at least 400ms based on the duration of the XHR being fetched (if MutationObserver is not supported)", function(done) {
			if (!t.isMutationObserverSupported()) {
				t.ifAutoXHR(
					done,
					function() {
						assert.closeTo(tf.beacons[i].t_done, 400, 50, "t_done is not close to 400ms");
						done();
					},
					this.skip.bind(this)
				);
			}
			else {
				this.skip();
			}
		});
	});
});
