/*eslint-env mocha*/
/*global assert,it,describe*/

describe("e2e/07-autoxhr/34-xhrs-rt-buffer-full", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 5 beacons: 1 onload, 4 xhr (XMLHttpRequest !== null)", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 5);
			});
	});

	it("Should have each XHR beacon have http.initiator = 'xhr'", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				for (var i = 1; i < tf.beacons.length; i++) {
					assert.equal(tf.beacons[i]["http.initiator"], "xhr");
				}

				done();
			});
	});

	it("Should have each XHR beacon have a t_page of less than 500ms", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				for (var i = 1; i < tf.beacons.length; i++) {
					assert.operator(tf.beacons[i].t_page, "<=", 500);
					assert.operator(tf.beacons[i].t_page, ">=", 0);
				}

				done();
			});
	});

	it("Should have each XHR beacon have a t_resp of less than 500ms", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				for (var i = 1; i < tf.beacons.length; i++) {
					assert.operator(tf.beacons[i].t_resp, "<=", 500);
					assert.operator(tf.beacons[i].t_resp, ">=", 0);
				}

				done();
			});
	});

	it("Should have each XHR beacon have a t_done of less than 500ms", function(done) {
		t.ifAutoXHR(
			done,
			function() {
				for (var i = 1; i < tf.beacons.length; i++) {
					assert.operator(tf.beacons[i].t_done, "<=", 500);
					assert.operator(tf.beacons[i].t_done, ">=", 0);
				}

				done();
			});
	});
});
