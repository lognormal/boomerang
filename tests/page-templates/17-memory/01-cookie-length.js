/*eslint-env mocha*/
/*global BOOMR_test,assert*/

describe("e2e/17-memory/01-cookie-length", function() {
	var tf = BOOMR.plugins.TestFramework;

	it("Should have sent a beacon", function() {
		// ensure we fired a beacon ('beacon')
		assert.isTrue(tf.fired_onbeacon);
	});

	it("Should have cookie length of 37 or 38 for HTTPS pages", function() {
		// Cookie length should include at least Foo and baz.  Y will be included on HTTPS.  RT might have data too.
		assert.operator(parseInt(tf.lastBeacon()["dom.ck"], 10), ">=", "Foo=bar; baz=abcdefghijklmnopqrstuvwxyz; RT=\"\"".length);
	});
});
