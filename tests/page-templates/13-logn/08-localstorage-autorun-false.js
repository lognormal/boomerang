/*eslint-env mocha*/
/*global BOOMR_test*/

describe("e2e/13-logn/05-localstorage", function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should have sent one beacon", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done,  1);
	});

	it("Should have a h.pg of FROMSERVER", function() {
		var b = tf.lastBeacon();
		assert.equal(b["h.pg"], "FROMSERVER");
	});

	it("Should have a localStorage config load time on beacon", function() {
		if (t.isLocalStorageSupported() && t.isJSONSupported()) {
			var b = tf.lastBeacon();
			assert.isDefined(b.t_configls);
			assert.operator(parseInt(b.t_configls), ">", 0, "t_configls is above 0");
			assert.operator(parseInt(b.t_configls), "<", BOOMR.hrNow(), "t_configls is less than now");
		}
		else {
			this.skip();
		}
	});

	it("Should have stored server config in localStorage", function(done) {
		if (t.isLocalStorageSupported() && t.isJSONSupported() && BOOMR.plugins.LOGN.isJson) {
			this.timeout(5000);
			// needs to wait for config request
			setTimeout(function() {
				var config = BOOMR.utils.getLocalStorage("LOGN");
				assert.equal(config.PageParams.pageGroups[0].parameter2, "FROMSERVER");
				done();
			}, 4000);
		}
		else {
			this.skip();
		}
	});

	it("Should have waited for page_ready to run", function() {
		if (t.isLocalStorageSupported() && t.isJSONSupported()) {
			var b = tf.lastBeacon();
			assert.operator(parseInt(b.t_done), ">", 10000);
		}
		else {
			this.skip();
		}
	});
});
