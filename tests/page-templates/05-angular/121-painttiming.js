/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,describe,it*/

describe("e2e/05-angular/121-painttiming.js", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
		clearTimeout(window.timerid);
	});

	it("Should have sent three beacons", function() {
		assert.equal(tf.beacons.length, 3);
	});

	describe("Beacon 1", function() {
		it("Should have http.initiator = spa_hard", function() {
			assert.equal(tf.beacons[0]["http.initiator"], "spa_hard");
		});

		it("Should have set pt.fp (if PaintTiming is supported and happened by load)", function() {
			if (!t.isPaintTimingSupported()) {
				return this.skip();
			}

			var pt = BOOMR.utils.arrayFind(performance.getEntriesByType("paint"), function(entry) {
				return entry.name === "first-paint";
			});

			if (!pt || pt.startTime > parseInt(tf.beacons[0].t_done, 10)) {
				// might happen if there haven't been any paints by beacon, like if it
				// loaded in the background
				return this.skip();
			}

			// validation of First Paint
			assert.isNumber(tf.beacons[0]["pt.fp"]);
			assert.operator(parseInt(tf.beacons[0]["pt.fp"], 10), ">=", 0);
			assert.equal(tf.beacons[0]["pt.fp"], Math.floor(pt.startTime));
		});

		it("Should have set pt.fcp (if PaintTiming is supported and happened by load)", function() {
			if (!t.isPaintTimingSupported()) {
				return this.skip();
			}

			var pt = BOOMR.utils.arrayFind(performance.getEntriesByType("paint"), function(entry) {
				return entry.name === "first-contentful-paint";
			});

			if (!pt || pt.startTime > parseInt(tf.beacons[0].t_done, 10)) {
				// might happen if there haven't been any paints by beacon, like if it
				// loaded in the background
				return this.skip();
			}

			// validation of First Contentful Paint
			assert.isNumber(tf.beacons[0]["pt.fcp"]);
			assert.operator(parseInt(tf.beacons[0]["pt.fcp"], 10), ">=", 0);
			assert.operator(parseInt(tf.beacons[0]["pt.fcp"], 10), ">=", parseInt(tf.beacons[0]["pt.fp"], 10));
			assert.equal(tf.beacons[0]["pt.fcp"], Math.floor(pt.startTime));
		});
	});

	describe("Beacon 2", function() {
		it("Should have http.initiator = spa", function() {
			assert.equal(tf.beacons[1]["http.initiator"], "spa");
		});

		it("Should not have set pt.fp", function() {
			assert.isUndefined(tf.beacons[1]["pt.fp"]);
		});

		it("Should not have set pt.fcp", function() {
			assert.isUndefined(tf.beacons[1]["pt.fcp"]);
		});
	});

	describe("Beacon 3", function() {
		it("Should have http.initiator = spa", function() {
			assert.equal(tf.beacons[2]["http.initiator"], "spa");
		});

		it("Should not have set pt.fp", function() {
			assert.isUndefined(tf.beacons[2]["pt.fp"]);
		});

		it("Should not have set pt.fcp", function() {
			assert.isUndefined(tf.beacons[2]["pt.fcp"]);
		});
	});
});
