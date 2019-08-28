/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/05-angular/123-alwayssendxhr-merging", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	var pathName = window.location.pathname;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have sent five beacons", function() {
		assert.equal(tf.beacons.length, 5);
	});

	//
	// Beacon 1
	//
	describe("Beacon 1 (spa_hard)", function() {
		var i = 0;

		it("Should have sent the first beacon as http.initiator = spa_hard", function() {
			assert.equal(tf.beacons[i]["http.initiator"], "spa_hard");
		});

		it("Should have a URL (u) of " + pathName, function() {
			var b = tf.beacons[i];
			assert.isTrue(b.u.indexOf(pathName) !== -1);
		});
	});

	if (BOOMR.plugins.AutoXHR) {
		//
		// Beacon 2
		//
		describe("Beacon 2 (spa)", function() {
			var i = 1;

			it("Should have sent the beacon as http.initiator = spa", function() {
				assert.equal(tf.beacons[i]["http.initiator"], "spa");
			});

			it("Should have a URL (u) of /widgets/1", function() {
				var b = tf.beacons[i];
				assert.include(b.u, "/widgets/1");
			});
		});

		//
		// Beacon 3
		//
		describe("Beacon 3 (xhr)", function() {
			var i = 2;

			it("Should have sent the beacon as http.initiator = xhr", function() {
				assert.equal(tf.beacons[i]["http.initiator"], "xhr");
			});

			it("Should have a URL (u) of bad.com", function() {
				var b = tf.beacons[i];
				assert.include(b.u, "bad.com");
			});
		});

		//
		// Beacon 4
		//
		describe("Beacon 4 (spa)", function() {
			var i = 3;

			it("Should have sent the beacon as http.initiator = spa", function() {
				assert.equal(tf.beacons[i]["http.initiator"], "spa");
			});

			it("Should have a URL (u) of " + pathname, function() {
				var b = tf.beacons[i];
				assert.include(b.u, pathname);
			});
		});

		//
		// Beacon 5
		//
		describe("Beacon 5 (xhr)", function() {
			var i = 4;

			it("Should have sent the beacon as http.initiator = xhr", function() {
				assert.equal(tf.beacons[i]["http.initiator"], "xhr");
			});

			it("Should have a URL (u) of bad.com", function() {
				var b = tf.beacons[i];
				assert.include(b.u, "bad.com");
			});
		});
	}
});
