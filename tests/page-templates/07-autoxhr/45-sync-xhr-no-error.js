/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/45-sync-xhr-no-error", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 2 beacons: 1 onload, 1 xhr (XMLHttpRequest is supported)", function(done) {
		this.timeout(10000);
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 2);
			},
			this.skip.bind(this)
		);
	});

	describe("Beacon 1 (onload)", function() {
		it("Should have correct url", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[0].u, "45-sync-xhr-no-error.html");
					done();
				},
				this.skip.bind(this)
			);
		});
	});

	describe("Beacon 2 (xhr) for 200 async XHR (XMLHttpRequest is supported)", function() {
		var i = 1;
		it("Should have correct url", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "/blackhole");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should not contain status", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.isUndefined(tf.beacons[i]["http.errno"]);
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should not have caused xhr_error to fire", function(done) {
			t.ifAutoXHR(
				done,
				function() {
					assert.isFalse(window.xhrErrorFired);
					done();
				},
				this.skip.bind(this)
			);
		});
	});
});
