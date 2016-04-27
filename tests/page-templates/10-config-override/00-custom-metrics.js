/*eslint-env mocha*/
/*global BOOMR_test,assert,BOOMR*/

describe("e2e/10-config-override/00-custom-metrics", function() {

	var tf = BOOMR.plugins.TestFramework;
	var t = BOOMR_test;

	it("Should pass basic beacon validation (since we enabled autorun in the override)", function(done) {
		t.validateBeaconWasSent(done);
	});

	it("Should have config override flag set to 1", function() {
		var b = tf.lastBeacon();
		assert.equal(b["c.o"], "");
	});

	it("Should have the custom metric 1 - JavaScript var", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet1, 11);
	});

	it("Should have the custom metric 2 - JavaScript function", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet2, 22);
	});

	it("Should be missing custom metric 3 - undefined JavaScript var", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet3, undefined);
	});

	it("Should have the custom metric 4 - XPath with ID (single quote)", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet4, 444.44);
	});

	it("Should have the custom metric 5 - URL", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet5, undefined);
	});

	it("Should have the custom metric 6 - JavaScript variable with a value of '12.345,67' when using comma ',' for the decimal separator and period '.' for the thousands separator via BOOMR_config page defaults", function() {
		var b = tf.lastBeacon();
		assert.equal(b.cmet6, 12345.67);
	});
});
