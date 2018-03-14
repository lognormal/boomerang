/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/07-autoxhr/02-onclick", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;
	it("Should have sent at 2 beacons, 1x onload, 1x xhr (if MutationObserver is supported)", function(done) {
		this.timeout(10000);
		if (t.isMutationObserverSupported()) {
			t.ifAutoXHR(
				done,
				function() {
					t.ensureBeaconCount(done, 2);
				},
				this.skip.bind(this));
		}
		else {
			this.skip();
		}
	});

	it("Should have sent 1 beacon, 1x onload, 0x xhr (if MutationObserver is not supported)", function(done) {
		this.timeout(10000);
		if (!t.isMutationObserverSupported()) {
			t.ifAutoXHR(
				done,
				function() {
					t.ensureBeaconCount(done, 1);
				},
				this.skip.bind(this));
		}
		else {
			this.skip();
		}
	});

	describe("Beacon 1", function() {
		it("Should have the first beacon URL of the page as 'u'", function(){
			assert.include(tf.beacons[0].u, "02-onclick.html");
		});
	});

	describe("Beacon 2", function() {
		it("Should have the second beacon URL of the image as 'u'", function() {
			if (BOOMR.plugins.AutoXHR && t.isMutationObserverSupported()) {
				assert.include(tf.beacons[1].u, "img.jpg");
			}
			else {
				this.skip();
			}
		});

		it("Should have the second beacon http.initiator = 'click'", function() {
			if (BOOMR.plugins.AutoXHR && t.isMutationObserverSupported()) {
				assert.include(tf.beacons[1]["http.initiator"], "click");
			}
			else {
				this.skip();
			}
		});
	});

});
