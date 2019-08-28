/*eslint-env mocha*/
/*global BOOMR,BOOMR_test,describe,it,assert*/

describe("e2e/07-autoxhr/44-fetch-polyfill", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent 2 beacons (if Fetch API is supported)", function(done) {
		if (!t.isFetchApiSupported()) {
			return this.skip();
		}
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 2);
			},
			this.skip.bind(this)
		);
	});

	it("Should have sent 1 beacon (if Fetch API is not supported)", function(done) {
		if (t.isFetchApiSupported()) {
			return this.skip();
		}
		t.ensureBeaconCount(done, 1);
	});

	describe("Beacon 1 (onload)", function() {
		it("Should be an onload beacon", function() {
			assert.include(tf.beacons[0].u, "44-fetch-polyfill.html");
			assert.equal(tf.beacons[0]["rt.start"], "navigation");
		});
	});

	describe("Beacon 2 (xhr) for polyfilled fetch (if Fetch API is supported)", function() {
		var i = 1;
		it("Should contain correct url", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.include(tf.beacons[i].u, "support/script200.js");
					done();
				},
				this.skip.bind(this)
			);
		});

		it("Should not have http.type = f (if Fetch API is supported)", function() {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			assert.isUndefined(tf.beacons[i]["http.type"]);
		});

		it("Should not contain error status", function(done) {
			if (!t.isFetchApiSupported()) {
				return this.skip();
			}
			t.ifAutoXHR(
				done,
				function() {
					assert.isUndefined(tf.beacons[i]["http.errno"]);
					done();
				},
				this.skip.bind(this)
			);
		});
	});
});

