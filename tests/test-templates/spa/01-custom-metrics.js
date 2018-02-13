/*eslint-env mocha*/
/*global BOOMR_test,assert*/
BOOMR_test.templates.SPA = BOOMR_test.templates.SPA || {};
BOOMR_test.templates.SPA["01-custom-metrics"] = function() {
	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have only sent one beacon", function(done) {
		this.timeout(10000);
		t.ensureBeaconCount(done, 1);
	});

	it("Should have the custom metric 1 - JavaScript var - having been updated by the Angular App", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet1, 11);
	});

	it("Should have the custom metric 2 - JavaScript function - having been updated by the Angular App", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet2, 22);
	});

	it("Should be missing custom metric 3 - undefined JavaScript var", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet3, undefined);
	});

	it("Should have the custom metric 4 - XPath - having been added by the Angular App", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet4, 444.44);
	});

	it("Should have the custom metric 5 - URL", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet5, 1);
	});
};
