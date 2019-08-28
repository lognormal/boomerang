/*eslint-env mocha*/
/*global assert*/

describe("e2e/07-autoxhr/43-payload-fetch", function() {
	var t = BOOMR_test;
	var tf = BOOMR.plugins.TestFramework;

	it("Should get 3 beacons: 1 onload, 2 xhr (XMLHttpRequest !== null and Fetch API is supported)", function(done) {
		this.timeout(10000);
		if (!t.isFetchApiSupported()) {
			return this.skip();
		}
		t.ifAutoXHR(
			done,
			function() {
				t.ensureBeaconCount(done, 3);
			});
	});

	it("Should have sent 1 beacon (if Fetch API is not supported)", function(done) {
		this.timeout(10000);
		if (t.isFetchApiSupported()) {
			return this.skip();
		}
		t.ensureBeaconCount(done, 1);
	});

	it("Should have not included the request payload data on the first Fetch event", function(done) {
		if (!t.isFetchApiSupported()) {
			return this.skip();
		}
		t.ifAutoXHR(
			done,
			function() {
				assert.isUndefined(window.xhrRequestPayload1);
				done();
			});
	});

	it("Should have not included the response payload data on the first Fetch event", function(done) {
		if (!t.isFetchApiSupported()) {
			return this.skip();
		}
		t.ifAutoXHR(
			done,
			function() {
				assert.isUndefined(window.xhrResponse1);
				done();
			});
	});

	it("Should have included the request payload data on the second Fetch event", function(done) {
		if (!t.isFetchApiSupported()) {
			return this.skip();
		}
		t.ifAutoXHR(
			done,
			function() {
				assert.isDefined(window.xhrRequestPayload2);
				done();
			});
	});

	it("Should have included the response payload data on the second Fetch event", function(done) {
		if (!t.isFetchApiSupported()) {
			return this.skip();
		}
		t.ifAutoXHR(
			done,
			function() {
				assert.isDefined(window.xhrResponse2);
				done();
			});
	});
});
