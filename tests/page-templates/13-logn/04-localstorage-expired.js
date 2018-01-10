/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/13-logn/04-localstorage-expired", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent one beacon", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done,  1);
	});

	it("Should have a h.cr from server when using JSON config and localStorage is supported", function() {
		if (t.isLocalStorageSupported() && BOOMR.plugins.LOGN.isJson) {
			var b = tf.lastBeacon();
			assert.notEqual(b["h.cr"], "abc");
		}
		else {
			this.skip();
		}
	});

	it("Should have a h.pg of FROMSERVER", function() {
		var b = tf.lastBeacon();
		assert.equal(b["h.pg"], "FROMSERVER");
	});

	it("Should have a config load time on beacon", function() {
		var b = tf.lastBeacon();
		assert.operator(parseInt(b.t_configjs), ">=", 2000, "t_configjs is above 2000 ms");
	});

	it("Should have a config first byte time on beacon", function() {
		var b = tf.lastBeacon();
		assert.operator(parseInt(b.t_configfb), ">=", 2000, "t_configfb is above 2000 ms");
	});

	it("Should not have a localStorage config load time on beacon", function() {
		var b = tf.lastBeacon();
		assert.isUndefined(b.t_configls);
	});

	it("Should have stored server config in localStorage", function() {
		if (t.isLocalStorageSupported() && BOOMR.plugins.LOGN.isJson) {
			var config = BOOMR.utils.getLocalStorage("LOGN");
			assert.equal(config.PageParams.pageGroups[0].parameter2, "FROMSERVER");
		}
		else {
			this.skip();
		}
	});
});
