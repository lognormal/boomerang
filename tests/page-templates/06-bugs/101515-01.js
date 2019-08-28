/*eslint-env mocha*/
/*global assert*/

describe("e2e/06-bugs/101515-01", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should get 2 beacons: 1 onload, 1 xhr", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 2);
	});

	it("Should have the first beacon be a Page Load beacon", function() {
		assert.isUndefined(tf.beacons[0]["http.initiator"]);
	});

	it("Should have the second beacon be a xhr beacon", function() {
		assert.equal(tf.beacons[1]["http.initiator"], "xhr");
	});

	it("Should have non negative timers", function() {
		for (var i = 0; i < tf.beacons.length; i++) {
			var b = tf.beacons[i];
			if (b.t_other) {
				var timers = b.t_other.split(",");
				if (timers && timers.length) {
					for (var j = 0; j < timers.length; j++) {
						var timer = timers[j].split("|");
						assert.operator(parseInt(timer[1], 10), ">=", 0, timer[0] + " is not negative");
					}
				}
			}
		}
	});

});
